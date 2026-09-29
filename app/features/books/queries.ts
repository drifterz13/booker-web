import { queryOptions } from "@tanstack/react-query";
import { listBooks } from "./api/books";

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
