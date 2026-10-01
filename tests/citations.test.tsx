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
    screen.getByRole("button", { name: "Open citation: Chapter 3 > Memory (pp. 42-43)" }),
  ).toHaveTextContent("[1]");
  expect(screen.getByRole("button", { name: "Open citation: p. 7" })).toHaveTextContent("[1]");
  await user.click(
    screen.getByRole("button", { name: "Open citation: Chapter 3 > Memory (pp. 42-43)" }),
  );
  expect(onCitation).toHaveBeenLastCalledWith(source);
  await user.click(screen.getByRole("button", { name: "Open citation: p. 7" }));
  expect(onCitation).toHaveBeenLastCalledWith(second);
});

it("shows page and section details on hover and keyboard focus, and dismisses with Escape", async () => {
  render(
    <MessageList
      messages={[answer("first", "Read.[pp. 42–43](#cite-s1)", [source])]}
      busy={false}
      onCitation={vi.fn()}
    />,
  );
  const user = userEvent.setup();
  const citation = screen.getByRole("button");

  expect(citation).toHaveTextContent("[1]");
  expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  await user.hover(citation);
  expect(await screen.findByRole("tooltip")).toHaveTextContent("Chapter 3 > Memory (pp. 42-43)");
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  await user.unhover(citation);
  await user.tab();
  expect(citation).toHaveFocus();
  expect(await screen.findByRole("tooltip")).toHaveTextContent("Chapter 3 > Memory (pp. 42-43)");
});

it("reuses source numbers across text parts and restarts numbering for each answer", () => {
  const second = { ...source, id: "s2", pdf_pages: [7], section_path: [] };
  const message = answer("first", "First.[pages](#cite-s1) Next.[pages](#cite-s2)", [
    source,
    second,
  ]);

  message.parts.push({ type: "text", text: "Again.[pages](#cite-s1)" });
  render(
    <MessageList
      messages={[message, answer("second", "Another answer.[pages](#cite-s2)", [second])]}
      busy={false}
      onCitation={vi.fn()}
    />,
  );

  expect(screen.getAllByRole("button").map((button) => button.textContent)).toEqual([
    "[1]",
    "[2]",
    "[1]",
    "[1]",
  ]);
});

it("shows only the last two sections before pages without changing source navigation", async () => {
  const nestedSource = {
    ...source,
    section_path: ["Part 1", "Strategy", "Chapter 3", "Turning disadvantages into advantages"],
    pdf_pages: [12, 13],
  };
  const onCitation = vi.fn();

  render(
    <MessageList
      messages={[answer("first", "Read.[1](#cite-s1)", [nestedSource])]}
      busy={false}
      onCitation={onCitation}
    />,
  );
  const user = userEvent.setup();

  await user.tab();
  const tooltip = await screen.findByRole("tooltip");

  expect(tooltip).toHaveTextContent(
    "Chapter 3 > Turning disadvantages into advantages (pp. 12-13)",
  );
  expect(tooltip).not.toHaveTextContent("Part 1");
  expect(tooltip).not.toHaveTextContent("Strategy");
  await user.click(screen.getByRole("button"));
  expect(onCitation).toHaveBeenCalledWith(nestedSource);
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

  expect(screen.getByRole("log")).toHaveTextContent("Read carefully ( [1] ) .");
  expect(screen.getByRole("log")).toHaveTextContent("Keep (this explanation), (website)");
  expect(screen.getByText("( [1](#cite-s1) )", { selector: "code" })).toBeVisible();
});

it("shows nonconsecutive pages in the tooltip without implying a page range", async () => {
  render(
    <MessageList
      messages={[answer("first", "Read.[1](#cite-s1)", [{ ...source, pdf_pages: [24, 26] }])]}
      busy={false}
      onCitation={vi.fn()}
    />,
  );

  const user = userEvent.setup();

  await user.tab();
  expect(await screen.findByRole("tooltip")).toHaveTextContent("pp. 24, 26");
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
  expect(screen.getByRole("button")).toHaveAccessibleName(
    "Open citation: Chapter 3 > Memory (pp. 42-43)",
  );
});

it("keeps valid sources when another source in the same snapshot is malformed", () => {
  const message = JSON.parse(
    JSON.stringify(answer("first", "Read [good](#cite-s1), [bad](#cite-bad).", [source])),
  );

  message.parts[1].data.sources.push({ ...source, id: "bad", pdf_pages: [1.5] });
  render(<MessageList messages={[message]} busy={false} onCitation={vi.fn()} />);

  expect(screen.getAllByRole("button")).toHaveLength(1);
  expect(screen.getByRole("button")).toHaveTextContent("[1]");
  expect(screen.queryByRole("link", { name: "bad" })).not.toBeInTheDocument();
  expect(screen.getByRole("log")).toHaveTextContent("bad");
});

it("clears the previous snapshot when the latest citation envelope is malformed", () => {
  const message = JSON.parse(JSON.stringify(answer("first", "Read [1](#cite-s1).", [source])));

  message.parts.push({ type: "data-citations", id: "latest", data: { sources: "invalid" } });
  render(<MessageList messages={[message]} busy={false} onCitation={vi.fn()} />);

  expect(screen.queryByRole("button")).not.toBeInTheDocument();
  expect(screen.getByRole("log")).toHaveTextContent("Read 1.");
});

it("keeps the answer readable when search tool input or output is malformed", () => {
  const message = JSON.parse(JSON.stringify(answer("first", "The answer is still readable.", [])));

  message.parts.unshift({
    type: "tool-search_book",
    toolCallId: "search-1",
    state: "output-available",
    input: { query: { invalid: true } },
    output: { passages: "invalid" },
  });
  render(<MessageList messages={[message]} busy={false} onCitation={vi.fn()} />);

  expect(screen.getByText("Book search failed")).toBeVisible();
  expect(screen.getByRole("log")).toHaveTextContent("The answer is still readable.");
});
