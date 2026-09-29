import type { BookSummary } from "~/features/books/api/types";
import { bookWithoutThumbnail, uploadedBook } from "./fixtures";

// In-memory API state, never React state or query cache. Reset for every story.
export const library: BookSummary[] = [];
export const uploads = new Map<
  string,
  { filename: string; objectKey: string; parts: Map<number, string>; complete: boolean }
>();

export function resetApiState() {
  library.splice(0, library.length, { ...uploadedBook }, { ...bookWithoutThumbnail });
  uploads.clear();
}
