import { http, HttpResponse } from "msw";
import { server } from "./mocks/server";
import { chatAnswer, pendingChatAnswer } from "./mocks/chat";
import { apiUrl } from "./mocks/handlers/books";
import { library } from "./mocks/state";
import { act, screen, waitFor, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { bookWithoutThumbnail, uploadedBook } from "./mocks/fixtures";
import { renderChatPage } from "./render-chat-page";

it("lets the reader choose a saved book from the list and shows its PDF preview", async () => {
  const { user } = renderChatPage();
  const selector = screen.getByRole("combobox", { name: "Book to chat with" });

  expect(screen.queryByRole("region", { name: "PDF preview" })).not.toBeInTheDocument();
  await waitFor(() => expect(selector).toBeEnabled());
  await user.click(selector);
  await user.click(await screen.findByRole("option", { name: uploadedBook.filename }));

  expect(screen.getByRole("combobox", { name: "Book to chat with" })).toHaveTextContent(
    uploadedBook.filename,
  );
  const preview = within(await screen.findByRole("region", { name: "PDF preview" }));

  expect(preview.getByRole("heading", { name: uploadedBook.filename })).toBeVisible();
  expect(await preview.findByText("1 / 1")).toBeVisible();
  expect(preview.getByRole("link", { name: "Download PDF" })).toHaveAttribute(
    "download",
    uploadedBook.filename,
  );
  expect(preview.queryByRole("alert")).not.toBeInTheDocument();
});

async function selectBook(
  user: ReturnType<typeof renderChatPage>["user"],
  name = uploadedBook.filename,
) {
  const selector = screen.getByRole("combobox", { name: "Book to chat with" });

  await waitFor(() => expect(selector).toBeEnabled());
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

it("lets the reader send their drafted question once the book finishes processing", async () => {
  server.use(http.post(`${apiUrl}/books/:id/chat`, () => chatAnswer()));
  library[0].active_index_id = null;
  const { user } = renderChatPage();

  await selectBook(user);
  await typeQuestion(user, "Help me read");
  expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled();
  expect(screen.getByText("This book is not ready for chat yet.")).toBeVisible();
  library[0].active_index_id = "index-ready";
  await user.click(screen.getByRole("button", { name: "Check book readiness" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Send message" })).toBeEnabled());
  await user.click(screen.getByRole("button", { name: "Send message" }));
  expect(await screen.findByText("Help me read")).toBeVisible();
  expect(await screen.findByText("slowly", { selector: "strong" })).toBeVisible();
});

async function typeQuestion(user: ReturnType<typeof renderChatPage>["user"], text: string) {
  const input = screen.getByRole("textbox", { name: "Your question" });

  // jsdom has zero-size panel geometry; pointer clicks can activate the resize handle.
  input.focus();
  await user.type(input, text, { skipClick: true });
}

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
