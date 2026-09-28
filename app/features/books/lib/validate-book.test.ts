import { describe, expect, it } from "vitest";
import { MAX_BOOK_SIZE, validateBook } from "./validate-book";

describe("book file validation", () => {
  it("accepts PDFs including uppercase extensions and missing browser MIME types", () => {
    expect(
      validateBook({ name: "BOOK.PDF", type: "application/pdf", size: MAX_BOOK_SIZE }),
    ).toBeNull();
    expect(validateBook({ name: "book.pdf", type: "", size: 1 })).toBeNull();
  });
  it("rejects non-PDF extensions or conflicting MIME types", () => {
    expect(validateBook({ name: "book.txt", type: "application/pdf", size: 10 })).toMatch(/PDF/);
    expect(validateBook({ name: "book.pdf", type: "text/plain", size: 10 })).toMatch(/PDF/);
  });
  it("rejects empty and oversized files", () => {
    expect(validateBook({ name: "book.pdf", type: "application/pdf", size: 0 })).toMatch(/empty/);
    expect(
      validateBook({ name: "book.pdf", type: "application/pdf", size: MAX_BOOK_SIZE + 1 }),
    ).toMatch(/100 MB/);
  });
});
