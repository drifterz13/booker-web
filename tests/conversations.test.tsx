import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter } from "react-router";
import { expect, it } from "vitest";
import { BooksProvider } from "~/features/books/books-context";
import { ChatProvider, useBookChat } from "~/features/chat/chat-context";
import { ChatPage } from "~/features/chat/pages/chat-page";
import { AppSidebar } from "~/shared/components/app-sidebar";
import { chatAnswer } from "./mocks/chat";
import { bookWithoutThumbnail, makeBook, uploadedBook } from "./mocks/fixtures";
import { apiUrl } from "./mocks/handlers/books";
import { server } from "./mocks/server";
import { library } from "./mocks/state";

const summary = {
  id: "conversation-1",
  book_id: uploadedBook.id,
  title: "Why read slowly?",
  created_at: "2026-10-02T08:00:00Z",
  updated_at: "2026-10-02T08:00:00Z",
};

function Workspace() {
  const { newChat } = useBookChat();

  return (
    <div>
      <AppSidebar onNewChat={newChat} onClose={() => {}} onNavigate={() => {}} />
      <ChatPage />
    </div>
  );
}

function renderWorkspace() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });

  render(
    <QueryClientProvider client={client}>
      <BooksProvider>
        <ChatProvider>
          <MemoryRouter>
            <Workspace />
          </MemoryRouter>
        </ChatProvider>
      </BooksProvider>
    </QueryClientProvider>,
  );

  return userEvent.setup();
}

async function ask(user: ReturnType<typeof userEvent.setup>, question: string) {
  const input = screen.getByRole("textbox", { name: "Your question" });

  input.focus();
  await user.type(input, question, { skipClick: true });
  await user.click(screen.getByRole("button", { name: "Send message" }));
}

it("creates a saved conversation with the latest user message and refreshes the global list", async () => {
  let saved = false;
  let requestBody: unknown;

  server.use(
    http.get(`${apiUrl}/conversations`, () => HttpResponse.json(saved ? [summary] : [])),
    http.post(`${apiUrl}/books/:id/conversations`, async ({ params, request }) => {
      expect(params.id).toBe(uploadedBook.id);
      requestBody = await request.json();
      saved = true;

      return chatAnswer("Read **slowly**.");
    }),
  );
  const user = renderWorkspace();

  expect(await screen.findByText("No conversations yet.")).toBeVisible();
  await ask(user, "How should I read?");
  expect(await screen.findByText("slowly", { selector: "strong" })).toBeVisible();
  const conversation = await screen.findByRole("button", { name: /Why read slowly\?/ });

  await waitFor(() => expect(conversation).toHaveAttribute("aria-current", "page"));
  expect(requestBody).toMatchObject({
    messages: [{ role: "user", parts: [{ type: "text", text: "How should I read?" }] }],
  });
  expect((requestBody as { messages: unknown[] }).messages).toHaveLength(1);
});

it("restores ordered messages and citations, then posts follow-ups to that conversation", async () => {
  let followUpBody: unknown;
  const source = {
    id: "s1",
    book_id: uploadedBook.id,
    index_id: "index-ready",
    chunk_id: "chunk-1",
    pdf_pages: [3],
    section_path: ["Reading"],
  };

  server.use(
    http.get(`${apiUrl}/conversations`, () => HttpResponse.json([summary])),
    http.get(`${apiUrl}/books/:id/conversations/:conversationId`, () =>
      HttpResponse.json({
        ...summary,
        messages: [
          { id: "user-1", role: "user", parts: [{ type: "text", text: "Why read slowly?" }] },
          {
            id: "assistant-1",
            role: "assistant",
            parts: [
              { type: "text", text: "Notice more details.[1](#cite-s1)" },
              { type: "data-citations", id: "citations", data: { sources: [source] } },
            ],
          },
        ],
      }),
    ),
    http.post(
      `${apiUrl}/books/:id/conversations/:conversationId/messages`,
      async ({ params, request }) => {
        expect(params.conversationId).toBe(summary.id);
        followUpBody = await request.json();

        return chatAnswer("Try one page at a time.");
      },
    ),
  );
  const user = renderWorkspace();
  const conversation = await screen.findByRole("button", { name: /Why read slowly\?/ });

  await user.click(conversation);
  expect(await screen.findByText("Notice more details.")).toBeVisible();
  expect(screen.getByRole("button", { name: "Open citation: Reading (p. 3)" })).toBeVisible();
  await ask(user, "How can I practice?");
  expect(await screen.findByText("Try one page at a time.")).toBeVisible();
  expect(followUpBody).toMatchObject({
    messages: [{ role: "user", parts: [{ type: "text", text: "How can I practice?" }] }],
  });
  expect((followUpBody as { messages: unknown[] }).messages).toHaveLength(1);
});

it("shows conversations from other books and selects the right book when opening one", async () => {
  library.splice(1, 1);
  library.push(
    ...Array.from({ length: 19 }, (_, index) =>
      makeBook({ id: `another-book-${index}`, filename: `Another book ${index}.pdf` }),
    ),
    bookWithoutThumbnail,
  );
  const otherConversation = {
    ...summary,
    id: "conversation-other-book",
    book_id: bookWithoutThumbnail.id,
    title: "A quieter thought",
    updated_at: "2026-10-03T08:00:00Z",
  };

  server.use(
    http.get(`${apiUrl}/conversations`, () => HttpResponse.json([otherConversation, summary])),
    http.get(`${apiUrl}/books/:id/conversations/:conversationId`, ({ params }) => {
      expect(params.id).toBe(bookWithoutThumbnail.id);
      expect(params.conversationId).toBe(otherConversation.id);

      return HttpResponse.json({
        ...otherConversation,
        messages: [
          { id: "user-other", role: "user", parts: [{ type: "text", text: "A quieter thought" }] },
          { id: "assistant-other", role: "assistant", parts: [{ type: "text", text: "Breathe." }] },
        ],
      });
    }),
  );
  const user = renderWorkspace();

  expect(await screen.findByRole("button", { name: /A quieter thought/ })).toBeVisible();
  expect(screen.getByRole("button", { name: /Why read slowly\?/ })).toBeVisible();
  await user.click(screen.getByRole("button", { name: /A quieter thought/ }));
  expect(await screen.findByText("Breathe.")).toBeVisible();
  await waitFor(() =>
    expect(screen.getByRole("combobox", { name: "Book to chat with" })).toHaveTextContent(
      bookWithoutThumbnail.filename,
    ),
  );
  expect(screen.getByRole("button", { name: /A quieter thought/ })).toHaveAttribute(
    "aria-current",
    "page",
  );
});

it("shows at most 20 conversations from the global list", async () => {
  server.use(
    http.get(`${apiUrl}/conversations`, () =>
      HttpResponse.json(
        Array.from({ length: 21 }, (_, index) => ({
          ...summary,
          id: `conversation-${index}`,
          title: `Conversation ${index}`,
          updated_at: new Date(Date.UTC(2026, 9, 3, 0, index)).toISOString(),
        })),
      ),
    ),
  );
  renderWorkspace();

  expect(await screen.findByRole("button", { name: /Conversation 20/ })).toBeVisible();
  expect(screen.getAllByRole("button", { name: /^Conversation \d/ })).toHaveLength(20);
  expect(screen.queryByRole("button", { name: /^Conversation 0 / })).not.toBeInTheDocument();
});
