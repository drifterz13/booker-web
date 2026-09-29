import { queryOptions } from "@tanstack/react-query";
import { getBookPdf, listBooks } from "./api/books";

export const bookKeys = {
  lists: ["books", "list"] as const,
  detail: (id: string) => ["books", "detail", id] as const,
};

export const BOOK_PAGE_SIZE = 20;

export function bookListOptions(offset: number) {
  return queryOptions({
    queryKey: [...bookKeys.lists, { offset, limit: BOOK_PAGE_SIZE }],
    queryFn: ({ signal }) => listBooks(offset, BOOK_PAGE_SIZE, signal),
  });
}

export function bookPdfOptions(id: string) {
  return queryOptions({
    queryKey: ["books", "pdf", id],
    queryFn: ({ signal }) => getBookPdf(id, signal),
    staleTime: (query) => Math.max(0, ((query.state.data?.expires_in ?? 900) - 60) * 1000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
