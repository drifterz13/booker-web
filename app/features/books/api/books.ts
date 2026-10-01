import { apiRequest } from "~/shared/api/client";
import { BookDetailSchema, BookListSchema, BookPdfSchema } from "./schemas";

export function listBooks(offset: number, limit: number, signal?: AbortSignal) {
  return apiRequest(`/books?offset=${offset}&limit=${limit}`, BookListSchema, { signal });
}

export function createBook(filename: string, objectKey: string) {
  return apiRequest("/books", BookDetailSchema, {
    method: "POST",
    body: JSON.stringify({ filename, object_key: objectKey }),
  });
}

export function getBookPdf(id: string, signal?: AbortSignal) {
  return apiRequest(`/books/${encodeURIComponent(id)}/pdf`, BookPdfSchema, {
    signal,
  });
}
