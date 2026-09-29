import type { BookSummary } from "~/features/books/api/types";

export function makeBook(overrides: Partial<BookSummary> = {}): BookSummary {
  return {
    id: "the-art-of-reading",
    filename: "The art of reading.pdf",
    status: "uploaded",
    active_index_id: "index-ready",
    created_at: "2026-09-29T08:00:00Z",
    thumbnail_url: "https://storage.booker.test/covers/the-art-of-reading.jpg",
    ...overrides,
  };
}

export const uploadedBook = makeBook();
export const bookWithoutThumbnail = makeBook({
  id: "a-quiet-mind",
  filename: "A quiet mind.pdf",
  thumbnail_url: null,
});
