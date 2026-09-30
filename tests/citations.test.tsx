import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { MessageList } from "~/features/chat/components/message-list";
import type { ChatMessage, CitationSource } from "~/features/chat/types";

const source: CitationSource = {
  id: "s1",
  book_id: "book-1",
  index_id: "index-1",
  chunk_id: "chunk-1",
  pdf_pages: [42, 43],
  section_path: ["Chapter 3", "Memory"],
};

function answer(id: string, text: string, sources: CitationSource[]): ChatMessage {
  return {
    id,
    role: "assistant",
    parts: [
      { type: "text", text },
      { type: "data-citations", id: "citations", data: { sources } },
    ],
  };
}

it("resolves citation IDs within their own message after history round-tripping", async () => {
  const onCitation = vi.fn();
  const second = { ...source, book_id: "book-2", pdf_pages: [7], section_path: [] };
  const messages = JSON.parse(
    JSON.stringify([
      answer("first", "First.[1](#cite-s1)", [source]),
      answer("second", "Second.[1](#cite-s1)", [second]),
    ]),
  );

  render(<MessageList messages={messages} busy={false} onCitation={onCitation} />);
  const user = userEvent.setup();

  expect(
    screen.getByRole("button", { name: "Open citation: Pages 42, 43 · Chapter 3 · Memory" }),
  ).toHaveTextContent("pp. 42–43");
  expect(screen.getByRole("button", { name: "Open citation: Page 7" })).toHaveTextContent("p. 7");
  await user.click(
    screen.getByRole("button", { name: "Open citation: Pages 42, 43 · Chapter 3 · Memory" }),
  );
  expect(onCitation).toHaveBeenLastCalledWith(source);
  await user.click(screen.getByRole("button", { name: "Open citation: Page 7" }));
  expect(onCitation).toHaveBeenLastCalledWith(second);
});

it("preserves backend citation punctuation, ordinary links, and code", () => {
  render(
    <MessageList
      messages={[
        answer(
          "first",
          "Read carefully ( [1](#cite-s1) ) . Keep (this explanation), ([website](https://example.com)), and `( [1](#cite-s1) )`.",
          [source],
        ),
      ]}
      busy={false}
      onCitation={vi.fn()}
    />,
  );

  expect(screen.getByRole("log")).toHaveTextContent("Read carefully ( pp. 42–43 ) .");
  expect(screen.getByRole("log")).toHaveTextContent("Keep (this explanation), (website)");
  expect(screen.getByText("( [1](#cite-s1) )", { selector: "code" })).toBeVisible();
});

it("shows nonconsecutive pages without implying an unsupported page range", () => {
  render(
    <MessageList
      messages={[answer("first", "Read.[1](#cite-s1)", [{ ...source, pdf_pages: [24, 26] }])]}
      busy={false}
      onCitation={vi.fn()}
    />,
  );

  expect(screen.getByRole("button")).toHaveTextContent("pp. 24, 26");
});

it("replaces snapshots and keeps unresolved, malformed, and invalid sources as plain text", () => {
  const message = answer(
    "first",
    "Read [old](#cite-s1), [unknown](#cite-missing), [malformed](#cite-), [invalid](#cite-bad), or [website](https://example.com).",
    [source],
  );

  message.parts.push({
    type: "data-citations",
    id: "new-snapshot",
    data: { sources: [{ ...source, id: "bad", pdf_pages: [0] }] },
  });
  render(<MessageList messages={[message]} busy={false} onCitation={vi.fn()} />);

  expect(screen.queryByRole("button")).not.toBeInTheDocument();

  for (const text of ["old", "unknown", "malformed", "invalid"]) {
    expect(screen.getByRole("log")).toHaveTextContent(text);
    expect(screen.queryByRole("link", { name: text })).not.toBeInTheDocument();
  }

  expect(screen.getByRole("link", { name: "website" })).toHaveAttribute(
    "href",
    "https://example.com",
  );
});

it("tolerates incomplete text and resolves a reference when metadata arrives later", () => {
  const onCitation = vi.fn();
  const message = answer("first", "Read.[1](#cite-s1", []);
  const { rerender } = render(<MessageList messages={[message]} busy onCitation={onCitation} />);

  expect(screen.getByRole("log")).toHaveTextContent("Read.");
  rerender(
    <MessageList
      messages={[answer("first", "Read.[1](#cite-s1)", [])]}
      busy
      onCitation={onCitation}
    />,
  );
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
  rerender(
    <MessageList
      messages={[answer("first", "Read.[1](#cite-s1)", [source])]}
      busy={false}
      onCitation={onCitation}
    />,
  );
  expect(screen.getByRole("button")).toHaveAttribute("title", "Pages 42, 43 · Chapter 3 · Memory");
});
