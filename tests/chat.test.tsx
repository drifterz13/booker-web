import { http, HttpResponse } from "msw";
import { server } from "./mocks/server";
import { chatAnswer, pendingChatAnswer } from "./mocks/chat";
import { apiUrl } from "./mocks/handlers/books";
import { library } from "./mocks/state";
import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { bookWithoutThumbnail, uploadedBook } from "./mocks/fixtures";
import { renderChatPage } from "./render-chat-page";
import { makePreviewPdf } from "./mocks/pdf";
import type { CitationSource } from "~/features/chat/types";

it("asks the reader to choose a book before showing the composer", async () => {
  const { user } = renderChatPage();

  expect(screen.queryByRole("region", { name: "PDF preview" })).not.toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Start a chat" })).toBeVisible();
  expect(screen.queryByRole("textbox", { name: "Your question" })).not.toBeInTheDocument();
  await selectBook(user);

  const initialPreview = within(await screen.findByRole("region", { name: "PDF preview" }));

  expect(initialPreview.getByRole("heading", { name: uploadedBook.filename })).toBeVisible();

  const selector = screen.getByRole("combobox", { name: "Book to chat with" });

  selector.focus();
  await user.keyboard("{ArrowDown}");
  await user.click(await screen.findByRole("option", { name: bookWithoutThumbnail.filename }));

  await waitFor(() =>
    expect(screen.getByRole("combobox", { name: "Book to chat with" })).toHaveTextContent(
      bookWithoutThumbnail.filename,
    ),
  );

  const preview = within(await screen.findByRole("region", { name: "PDF preview" }));

  expect(
    await preview.findByRole("heading", { name: bookWithoutThumbnail.filename }),
  ).toBeVisible();
  expect(await preview.findByText("1 / 1")).toBeVisible();
  expect(preview.getAllByRole("button", { name: "Enter fullscreen" })).toHaveLength(1);
  expect(preview.queryByRole("button", { name: "Fit page to width" })).not.toBeInTheDocument();
  expect(preview.queryByRole("link", { name: "Download PDF" })).not.toBeInTheDocument();
  expect(preview.queryByRole("alert")).not.toBeInTheDocument();
});

it("enters and exits fullscreen from the PDF toolbar", async () => {
  const { user } = renderChatPage();

  await selectBook(user);

  const preview = within(await screen.findByRole("region", { name: "PDF preview" }));
  const reader = preview.getByLabelText("PDF controls").parentElement!;
  let fullscreenElement: Element | null = null;

  Object.defineProperty(document, "fullscreenElement", {
    configurable: true,
    get: () => fullscreenElement,
  });
  Object.defineProperty(reader, "requestFullscreen", {
    configurable: true,
    value: async () => {
      fullscreenElement = reader;
      document.dispatchEvent(new Event("fullscreenchange"));
    },
  });
  Object.defineProperty(document, "exitFullscreen", {
    configurable: true,
    value: async () => {
      fullscreenElement = null;
      document.dispatchEvent(new Event("fullscreenchange"));
    },
  });

  try {
    await user.click(preview.getByRole("button", { name: "Enter fullscreen" }));
    expect(preview.getByRole("button", { name: "Exit fullscreen" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await user.click(preview.getByRole("button", { name: "Exit fullscreen" }));
    expect(preview.getByRole("button", { name: "Enter fullscreen" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  } finally {
    Reflect.deleteProperty(document, "fullscreenElement");
    Reflect.deleteProperty(document, "exitFullscreen");
  }
});

it("uses the book loader while a PDF document is loading", async () => {
  let releasePdf!: () => void;
  const pdfReady = new Promise<void>((resolve) => {
    releasePdf = resolve;
  });

  server.use(
    http.get("https://storage.booker.test/books/:filename", async () => {
      await pdfReady;

      return new HttpResponse(makePreviewPdf(), { headers: { "Content-Type": "application/pdf" } });
    }),
  );

  try {
    const { user } = renderChatPage();

    await selectBook(user);

    const preview = within(await screen.findByRole("region", { name: "PDF preview" }));

    expect(await preview.findByLabelText("PDF controls")).toBeVisible();
    expect(preview.getAllByText("Loading page…")).toHaveLength(1);
    expect(
      preview.getByText("Loading page…").closest("output")?.querySelector(".book-motion"),
    ).toBeTruthy();
    expect(preview.queryByText("Loading PDF…")).not.toBeInTheDocument();
  } finally {
    releasePdf();
  }
});

async function selectBook(
  user: ReturnType<typeof renderChatPage>["user"],
  name = uploadedBook.filename,
) {
  const selector = screen.queryByRole("combobox", { name: "Book to chat with" });

  if (selector) {
    if (selector.textContent?.includes(name)) return;

    selector.focus();
    await user.keyboard("{ArrowDown}");
    await user.click(await screen.findByRole("option", { name }));
  } else {
    await user.click(await screen.findByRole("button", { name: new RegExp(name, "i") }));
  }
}

it("lets the reader send a question, view matching passages, and ask a follow-up", async () => {
  let answered = false;

  server.use(
    http.post(`${apiUrl}/books/:id/conversations`, () => {
      const response = answered
        ? chatAnswer("Pause after each paragraph and reflect on what you read.")
        : chatAnswer("Read **slowly**.", true);

      answered = true;

      return response;
    }),
    http.post(`${apiUrl}/books/:id/conversations/:conversationId/messages`, () =>
      chatAnswer("Pause after each paragraph and reflect on what you read."),
    ),
  );
  const { user } = renderChatPage();

  expect(screen.queryByRole("button", { name: "Send message" })).not.toBeInTheDocument();
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

it("keeps a failed question with an inline error and no retry button", async () => {
  server.use(
    http.post(`${apiUrl}/books/:id/conversations`, () =>
      HttpResponse.json(
        { detail: "Chat is not configured" },
        { status: 503, headers: { "x-conversation-id": "failed-conversation" } },
      ),
    ),
  );
  const { user } = renderChatPage();

  await selectBook(user);
  await typeQuestion(user, "Help me read{Enter}");
  expect(await screen.findByRole("alert")).toHaveTextContent("Chat is not configured");
  expect(screen.getAllByText("Help me read")).toHaveLength(1);
  expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
});

it("starts a new conversation after a failed stream even when it received an ID", async () => {
  let creates = 0;

  server.use(
    http.post(`${apiUrl}/books/:id/conversations`, () => {
      creates++;

      return creates === 1
        ? new HttpResponse(
            'data: {"type":"start","messageId":"failed-answer"}\n\ndata: {"type":"error","errorText":"Generation failed"}\n\ndata: [DONE]\n\n',
            {
              headers: {
                "Content-Type": "text/event-stream",
                "x-vercel-ai-ui-message-stream": "v1",
                "x-conversation-id": "unsaved-conversation",
              },
            },
          )
        : chatAnswer();
    }),
  );
  const { user } = renderChatPage();

  await selectBook(user);
  await typeQuestion(user, "What should I notice?{Enter}");
  expect(await screen.findByRole("alert")).toHaveTextContent("Generation failed");
  await typeQuestion(user, "Can you try again?{Enter}");
  expect(await screen.findByText("slowly", { selector: "strong" })).toBeVisible();
  expect(creates).toBe(2);
});

it("falls back to a readable chat error when the error body does not match its schema", async () => {
  server.use(
    http.post(`${apiUrl}/books/:id/conversations`, () =>
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
    http.post(`${apiUrl}/books/:id/conversations`, ({ params }) =>
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
  server.use(http.post(`${apiUrl}/books/:id/conversations`, () => chatAnswer()));
  library[0].active_index_id = null;
  library[1].active_index_id = null;
  const { user } = renderChatPage();

  expect(await screen.findByText(/Your books are still processing/)).toBeVisible();
  expect(screen.queryByRole("textbox", { name: "Your question" })).not.toBeInTheDocument();
  library[0].active_index_id = "index-ready";
  await screen.findByRole(
    "button",
    { name: new RegExp(library[0].filename, "i") },
    { timeout: 4_000 },
  );
  expect(screen.queryByRole("textbox", { name: "Your question" })).not.toBeInTheDocument();
  await selectBook(user, library[0].filename);
  await typeQuestion(user, "Help me read");
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

function stubPdfLayout() {
  let resizeReader: (width: number) => void = () => {};

  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(private callback: ResizeObserverCallback) {}
      observe(target: Element) {
        if (target.hasAttribute("data-index")) {
          const frame = target.firstElementChild as HTMLElement;
          const width = Number.parseFloat(frame.style.width);
          const height = width * (792 / 612);

          vi.spyOn(target, "getBoundingClientRect").mockReturnValue({ width, height } as DOMRect);
          this.callback(
            [
              {
                target,
                borderBoxSize: [{ inlineSize: width, blockSize: height }],
              } as unknown as ResizeObserverEntry,
            ],
            this as ResizeObserver,
          );

          return;
        }

        if (!target.parentElement?.classList.contains("pdf-reader")) return;

        resizeReader = (width) =>
          this.callback(
            [
              {
                target,
                contentRect: { width, height: 800 },
                borderBoxSize: [{ inlineSize: width, blockSize: 800 }],
              } as unknown as ResizeObserverEntry,
            ],
            this as ResizeObserver,
          );
        resizeReader(600);
      }
      unobserve() {}
      disconnect() {}
    },
  );

  return (width: number) => resizeReader(width);
}

it("mounts only nearby pages while scrolling a long PDF", async () => {
  stubPdfLayout();
  server.use(
    http.get(
      "https://storage.booker.test/books/:filename",
      () =>
        new HttpResponse(makePreviewPdf(120), { headers: { "Content-Type": "application/pdf" } }),
    ),
  );
  const { user } = renderChatPage();

  await selectBook(user);

  const preview = within(await screen.findByRole("region", { name: "PDF preview" }));

  expect(await preview.findByText("1 / 120")).toBeVisible();
  expect(await preview.findByLabelText("PDF page 1")).toBeVisible();
  expect(preview.getAllByLabelText(/^PDF page \d+$/).length).toBeLessThan(12);

  const scrollRoot = preview.getByLabelText("PDF controls").nextElementSibling as HTMLElement;

  scrollRoot.scrollTop = 90 * (600 * (792 / 612) + 16);
  fireEvent.scroll(scrollRoot);

  expect(await preview.findByText("91 / 120")).toBeVisible();
  expect(await preview.findByLabelText("PDF page 91")).toBeVisible();
  expect(preview.getAllByLabelText(/^PDF page \d+$/).length).toBeLessThan(12);
});

it("opens citations at their physical PDF page, fetches fresh URLs, and preserves snapshots in history", async () => {
  const resizeReader = stubPdfLayout();

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
    http.post(`${apiUrl}/books/:id/conversations`, () =>
      chatAnswer("Small habits compound.[1](#cite-s1) [old](#cite-old)", false, [
        { sources: [{ ...source, id: "old" }] },
        { sources: [source] },
      ]),
    ),
    http.post(`${apiUrl}/books/:id/conversations/:conversationId/messages`, async ({ request }) => {
      history = (await request.json()) as typeof history;

      return chatAnswer("A follow-up answer.");
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
  expect(preview.getAllByLabelText(/^PDF page \d$/)).toHaveLength(3);
  expect(preview.getByRole("heading", { name: bookWithoutThumbnail.filename })).toBeVisible();
  expect(screen.getByRole("combobox", { name: "Book to chat with" })).toHaveTextContent(
    uploadedBook.filename,
  );
  expect(preview.queryByRole("navigation", { name: "Cited PDF pages" })).not.toBeInTheDocument();
  const scrollRoot = preview.getByLabelText("PDF controls").nextElementSibling as HTMLElement;

  expect(scrollRoot).toBeTruthy();

  const pageFrames = preview.getAllByLabelText(/^PDF page \d$/);

  expect(pageFrames).toHaveLength(3);
  scrollRoot!.scrollTop = 2 * (600 * 1.3 + 16) + 30;
  fireEvent.scroll(scrollRoot!);
  expect(preview.getByText("3 / 3")).toBeVisible();

  const beforeZoom = scrollRoot!.scrollTop;

  await user.click(preview.getByRole("button", { name: "Zoom in" }));
  expect(preview.getByText("3 / 3")).toBeVisible();
  expect(scrollRoot!.scrollTop).toBeGreaterThan(beforeZoom);

  await user.click(preview.getByRole("button", { name: "Previous page" }));
  expect(preview.getByText("2 / 3")).toBeVisible();

  const reader = preview.getByLabelText("PDF controls").parentElement!;
  let fullscreenElement: Element | null = null;

  Object.defineProperty(document, "fullscreenElement", {
    configurable: true,
    get: () => fullscreenElement,
  });
  Object.defineProperty(reader, "requestFullscreen", {
    configurable: true,
    value: async () => {
      fullscreenElement = reader;
      document.dispatchEvent(new Event("fullscreenchange"));
      resizeReader(900);
    },
  });

  try {
    const beforeFullscreen = scrollRoot!.scrollTop;

    await user.click(preview.getByRole("button", { name: "Enter fullscreen" }));
    expect(preview.getByText("2 / 3")).toBeVisible();
    expect(scrollRoot!.scrollTop).toBeGreaterThan(beforeFullscreen);
  } finally {
    Reflect.deleteProperty(document, "fullscreenElement");
  }

  await user.click(preview.getByRole("button", { name: "Next page" }));
  expect(preview.getByText("3 / 3")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Open citation: Memory (pp. 2-3)" }));
  expect(await preview.findByText("2 / 3")).toBeVisible();
  expect(pdfCalls).toBe(2);

  await typeQuestion(user, "Explain more{Enter}");
  await waitFor(() => expect(history?.messages).toHaveLength(1));
  expect(history?.messages[0].role).toBe("user");
});

it("keeps Shift+Enter as a new line until the reader clicks Send", async () => {
  server.use(http.post(`${apiUrl}/books/:id/conversations`, () => chatAnswer()));
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
