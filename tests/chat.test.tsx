import { http, HttpResponse } from "msw";
import { server } from "./mocks/server";
import { chatAnswer, pendingChatAnswer } from "./mocks/chat";
import { apiUrl } from "./mocks/handlers/books";
import { library } from "./mocks/state";
import { act, screen, waitFor, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { bookWithoutThumbnail, uploadedBook } from "./mocks/fixtures";
import { renderChatPage } from "./render-chat-page";
import { makePreviewPdf } from "./mocks/pdf";
import type { CitationSource } from "~/features/chat/types";

it("selects a saved book automatically and lets the reader choose another", async () => {
  const { user } = renderChatPage();
  const selector = screen.getByRole("combobox", { name: "Book to chat with" });

  expect(screen.queryByRole("region", { name: "PDF preview" })).not.toBeInTheDocument();
  await waitFor(() => expect(selector).toHaveTextContent(uploadedBook.filename));

  const initialPreview = within(await screen.findByRole("region", { name: "PDF preview" }));

  expect(initialPreview.getByRole("heading", { name: uploadedBook.filename })).toBeVisible();

  selector.focus();
  await user.keyboard("{ArrowDown}");
  await user.click(await screen.findByRole("option", { name: bookWithoutThumbnail.filename }));

  await waitFor(() => expect(selector).toHaveTextContent(bookWithoutThumbnail.filename));

  const preview = within(await screen.findByRole("region", { name: "PDF preview" }));

  expect(
    await preview.findByRole("heading", { name: bookWithoutThumbnail.filename }),
  ).toBeVisible();
  expect(await preview.findByText("1 / 1")).toBeVisible();
  expect(preview.getByRole("link", { name: "Download PDF" })).toHaveAttribute(
    "download",
    bookWithoutThumbnail.filename,
  );
  expect(preview.queryByRole("alert")).not.toBeInTheDocument();
});

async function selectBook(
  user: ReturnType<typeof renderChatPage>["user"],
  name = uploadedBook.filename,
) {
  const selector = screen.getByRole("combobox", { name: "Book to chat with" });

  await waitFor(() => expect(selector).toBeEnabled());

  if (selector.textContent?.includes(name)) return;

  selector.focus();
  await user.keyboard("{ArrowDown}");
  await user.click(await screen.findByRole("option", { name }));
}

it("lets the reader send a question, view matching passages, and ask a follow-up", async () => {
  let answered = false;

  server.use(
    http.post(`${apiUrl}/books/:id/chat`, () => {
      const response = answered
        ? chatAnswer("Pause after each paragraph and reflect on what you read.")
        : chatAnswer("Read **slowly**.", true);

      answered = true;

      return response;
    }),
  );
  const { user } = renderChatPage();

  expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled();
  await selectBook(user);
  await typeQuestion(user, "How should I read?");
  expect(screen.getByRole("textbox", { name: "Your question" })).toHaveValue("How should I read?");
  expect(screen.queryByRole("log")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Send message" }));
  expect(await screen.findByText("How should I read?")).toBeVisible();
  expect(await screen.findByText("slowly", { selector: "strong" })).toBeVisible();
  expect(screen.getByRole("textbox", { name: "Your question" })).toHaveValue("");
  await user.click(screen.getByText("Found 1 passages"));
  expect(screen.getByText("Take your time.")).toBeVisible();

  await typeQuestion(user, "Explain more{Enter}");
  expect(await screen.findByText("Explain more")).toBeVisible();
  expect(
    await screen.findByText("Pause after each paragraph and reflect on what you read."),
  ).toBeVisible();
  expect(screen.getByText("How should I read?")).toBeVisible();
  expect(screen.getByText("slowly", { selector: "strong" })).toBeVisible();
});

it("keeps a failed question and retries without duplicating it", async () => {
  let calls = 0;

  server.use(
    http.post(`${apiUrl}/books/:id/chat`, () =>
      ++calls === 1
        ? HttpResponse.json({ detail: "Chat is not configured" }, { status: 503 })
        : chatAnswer(),
    ),
  );
  const { user } = renderChatPage();

  await selectBook(user);
  await typeQuestion(user, "Help me read{Enter}");
  expect(await screen.findByRole("alert")).toHaveTextContent("Chat is not configured");
  await user.click(screen.getByRole("button", { name: "Retry" }));
  expect(await screen.findByText("slowly", { selector: "strong" })).toBeVisible();
  expect(screen.getAllByText("Help me read")).toHaveLength(1);
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

it("falls back to a readable chat error when the error body does not match its schema", async () => {
  server.use(
    http.post(`${apiUrl}/books/:id/chat`, () =>
      HttpResponse.json({ detail: ["invalid"] }, { status: 503 }),
    ),
  );
  const { user } = renderChatPage();

  await selectBook(user);
  await typeQuestion(user, "Help me read{Enter}");
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Could not generate an answer (503). Please try again.",
  );
});

it("stops a streaming answer and clears the conversation when switching books", async () => {
  const pending = pendingChatAnswer();

  server.use(
    http.post(`${apiUrl}/books/:id/chat`, ({ params }) =>
      params.id === bookWithoutThumbnail.id
        ? chatAnswer("Explore this book at your own pace.")
        : pending.response,
    ),
  );
  const { user } = renderChatPage();

  await selectBook(user);
  await typeQuestion(user, "Help me read{Enter}");
  expect(await screen.findByText("slowly", { selector: "strong" })).toBeVisible();

  const conversationScroll = screen.getByRole("log").closest("[data-chat-scroll]");

  expect(conversationScroll).toContainElement(screen.getByRole("log"));
  expect(conversationScroll).toContainElement(screen.getByText("Answering…"));
  expect(conversationScroll).not.toContainElement(
    screen.getByRole("textbox", { name: "Your question" }),
  );
  await user.click(screen.getByRole("button", { name: "Stop response" }));
  await waitFor(() =>
    expect(screen.queryByRole("button", { name: "Stop response" })).not.toBeInTheDocument(),
  );
  expect(screen.getByText("slowly", { selector: "strong" })).toBeVisible();
  await act(async () => {
    pending.finish();
  });
  await selectBook(user, bookWithoutThumbnail.filename);
  expect(screen.queryByRole("log")).not.toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: "Your question" })).toHaveValue("");
  expect(screen.queryByText("Help me read")).not.toBeInTheDocument();
  expect(screen.queryByText("slowly", { selector: "strong" })).not.toBeInTheDocument();
  await typeQuestion(user, "How about this book?{Enter}");
  expect(await screen.findByText("How about this book?")).toBeVisible();
  expect(await screen.findByText("Explore this book at your own pace.")).toBeVisible();
});

it("offers a processing book for chat once it becomes ready", async () => {
  server.use(http.post(`${apiUrl}/books/:id/chat`, () => chatAnswer()));
  library[0].active_index_id = null;
  library[1].active_index_id = null;
  const { user } = renderChatPage();

  const selector = screen.getByRole("combobox", { name: "Book to chat with" });

  await waitFor(() => expect(selector).toHaveTextContent("No books ready yet"));
  await user.click(selector);
  expect(
    screen.getByRole("option", { name: `${library[0].filename} · Processing` }),
  ).toHaveAttribute("data-disabled");
  await user.keyboard("{Escape}");
  await typeQuestion(user, "Help me read");
  expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled();
  expect(screen.getByText("Processing books will be available here automatically.")).toBeVisible();
  expect(screen.queryByRole("button", { name: "Check book readiness" })).not.toBeInTheDocument();
  library[0].active_index_id = "index-ready";
  await waitFor(() => expect(screen.getByRole("button", { name: "Send message" })).toBeEnabled(), {
    timeout: 4_000,
  });
  expect(selector).toHaveTextContent(library[0].filename);
  await user.click(screen.getByRole("button", { name: "Send message" }));
  expect(await screen.findByText("Help me read")).toBeVisible();
  expect(await screen.findByText("slowly", { selector: "strong" })).toBeVisible();
}, 8_000);

async function typeQuestion(user: ReturnType<typeof renderChatPage>["user"], text: string) {
  const input = screen.getByRole("textbox", { name: "Your question" });

  // jsdom has zero-size panel geometry; pointer clicks can activate the resize handle.
  input.focus();
  await user.type(input, text, { skipClick: true });
}

it("opens citations at their physical PDF page, fetches fresh URLs, and preserves snapshots in history", async () => {
  const source: CitationSource = {
    id: "s1",
    book_id: bookWithoutThumbnail.id,
    index_id: "index-ready",
    chunk_id: "chunk-1",
    pdf_pages: [2, 3],
    section_path: ["Memory"],
  };
  let pdfCalls = 0;
  let history: { messages: { role: string; parts: unknown[] }[] } | undefined;

  server.use(
    http.post(`${apiUrl}/books/:id/chat`, async ({ request }) => {
      history = (await request.json()) as typeof history;

      return chatAnswer("Small habits compound.[1](#cite-s1) [old](#cite-old)", false, [
        { sources: [{ ...source, id: "old" }] },
        { sources: [source] },
      ]);
    }),
    http.get(`${apiUrl}/books/${source.book_id}/pdf`, () => {
      pdfCalls++;

      return HttpResponse.json({ url: `https://storage.booker.test/books/${source.book_id}.pdf` });
    }),
    http.get(
      "https://storage.booker.test/books/:filename",
      () => new HttpResponse(makePreviewPdf(3), { headers: { "Content-Type": "application/pdf" } }),
    ),
  );
  const { user } = renderChatPage();

  await selectBook(user);
  await typeQuestion(user, "How do habits work?{Enter}");
  const citation = await screen.findByRole("button", {
    name: "Open citation: Memory (pp. 2-3)",
  });

  expect(screen.queryByRole("link", { name: "old" })).not.toBeInTheDocument();
  await user.click(citation);
  const preview = within(screen.getByRole("region", { name: "PDF preview" }));

  expect(await preview.findByText("2 / 3")).toBeVisible();
  expect(preview.getByRole("heading", { name: bookWithoutThumbnail.filename })).toBeVisible();
  expect(screen.getByRole("combobox", { name: "Book to chat with" })).toHaveTextContent(
    uploadedBook.filename,
  );
  expect(preview.queryByRole("navigation", { name: "Cited PDF pages" })).not.toBeInTheDocument();
  await user.click(preview.getByRole("button", { name: "Next page" }));
  expect(preview.getByText("3 / 3")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Open citation: Memory (pp. 2-3)" }));
  expect(await preview.findByText("2 / 3")).toBeVisible();
  expect(pdfCalls).toBe(2);

  await typeQuestion(user, "Explain more{Enter}");
  await waitFor(() =>
    expect(history?.messages.filter((message) => message.role === "assistant")).toHaveLength(1),
  );
  const assistant = history!.messages.find((message) => message.role === "assistant")!;

  expect(assistant.parts).toContainEqual({
    type: "data-citations",
    id: "citations",
    data: { sources: [source] },
  });
});

it("keeps Shift+Enter as a new line until the reader clicks Send", async () => {
  server.use(http.post(`${apiUrl}/books/:id/chat`, () => chatAnswer()));
  const { user } = renderChatPage();

  await selectBook(user);
  await typeQuestion(user, "How should I read?{Shift>}{Enter}{/Shift}Give me an example.");
  expect(screen.getByRole("textbox", { name: "Your question" })).toHaveValue(
    "How should I read?\nGive me an example.",
  );
  expect(screen.queryByRole("log")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Send message" }));
  expect(await screen.findByText("How should I read? Give me an example.")).toBeVisible();
  expect(await screen.findByText("slowly", { selector: "strong" })).toBeVisible();
});
