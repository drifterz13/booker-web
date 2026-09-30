import { createContext, useContext, useState, type ReactNode } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { listBooks } from "./api/books";
import type { BookSummary } from "./api/types";
import { bookKeys, BOOK_PAGE_SIZE } from "./queries";

interface BooksContextValue {
  books: BookSummary[];
  selectedBook: BookSummary | undefined;
  selectBook: (id: string) => void;
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadingMore: boolean;
  loadMore: () => void;
  retry: () => void;
}

const BooksContext = createContext<BooksContextValue | null>(null);

export function BooksProvider({ children }: { children: ReactNode }) {
  const [selectedId, setSelectedId] = useState<string>();
  const library = useInfiniteQuery({
    queryKey: [...bookKeys.lists, "selector"],
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => listBooks(pageParam, BOOK_PAGE_SIZE, signal),
    getNextPageParam: (last, _pages, offset) =>
      last.length === BOOK_PAGE_SIZE ? offset + BOOK_PAGE_SIZE : undefined,
  });
  const books = library.data?.pages.flat() ?? [];

  return (
    <BooksContext.Provider
      value={{
        books,
        selectedBook:
          books.find((book) => book.id === selectedId) ??
          books.find((book) => book.status === "uploaded"),
        selectBook: setSelectedId,
        loading: library.isPending,
        error: library.error,
        hasMore: library.hasNextPage,
        loadingMore: library.isFetchingNextPage,
        loadMore: () => {
          void library.fetchNextPage();
        },
        retry: () => {
          void library.refetch();
        },
      }}
    >
      {children}
    </BooksContext.Provider>
  );
}
export function useBooks() {
  const context = useContext(BooksContext);

  if (!context) throw new Error("useBooks must be used within BooksProvider");

  return context;
}
