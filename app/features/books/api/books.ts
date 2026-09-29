import { apiRequest } from "~/shared/api/client";
import type { BookDetail, BookSummary } from "./types";

export function listBooks(offset: number, limit: number, signal?: AbortSignal) {
  return apiRequest<BookSummary[]>(`/books?offset=${offset}&limit=${limit}`, { signal });
}

export function createBook(filename: string, objectKey: string) {
  return apiRequest<BookDetail>("/books", {
    method: "POST",
    body: JSON.stringify({ filename, object_key: objectKey }),
  });
}
