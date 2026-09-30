import { HttpResponse } from "msw";
import { uploadedBook } from "./fixtures";
import type { CitationData } from "~/features/chat/types";

function sse(events: object[]) {
  return events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join("");
}

function textEvents(text: string) {
  return [
    { type: "text-start", id: "text-1" },
    { type: "text-delta", id: "text-1", delta: text },
    { type: "text-end", id: "text-1" },
  ];
}

const headers = {
  "Content-Type": "text/event-stream",
  "x-vercel-ai-ui-message-stream": "v1",
};

export function chatAnswer(
  text = "Read **slowly**.",
  withSearch = false,
  citations: CitationData[] = [],
) {
  const searchEvents = withSearch
    ? [
        {
          type: "data-status",
          data: { phase: "searching", message: "Finding relevant passages…" },
          transient: true,
        },
        {
          type: "tool-input-available",
          toolCallId: "search-1",
          toolName: "search_book",
          input: { query: "reading" },
        },
        {
          type: "tool-output-available",
          toolCallId: "search-1",
          output: {
            book_id: uploadedBook.id,
            index_id: "index-ready",
            passages: [
              {
                chunk_id: "chunk-1",
                text: "Take your time.",
                section_path: ["Reading"],
                pdf_pages: [3],
              },
            ],
          },
        },
      ]
    : [];

  return new HttpResponse(
    sse([
      { type: "start", messageId: crypto.randomUUID() },
      ...searchEvents,
      ...textEvents(text),
      ...citations.map((data) => ({ type: "data-citations", id: "citations", data })),
      { type: "finish" },
    ]) + "data: [DONE]\n\n",
    { headers },
  );
}

export function pendingChatAnswer(text = "Read **slowly**.") {
  let controller: ReadableStreamDefaultController<Uint8Array>;
  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c;
      c.enqueue(
        new TextEncoder().encode(
          sse([{ type: "start", messageId: crypto.randomUUID() }, ...textEvents(text).slice(0, 2)]),
        ),
      );
    },
  });

  return {
    response: new HttpResponse(stream, { headers }),
    finish: () => controller.close(),
  };
}
