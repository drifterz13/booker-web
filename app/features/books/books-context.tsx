import { createContext, useContext, useState, type ReactNode } from "react";
import { validateBook } from "./lib/validate-book";
import type { Book } from "./types";

interface BooksContextValue {
  books: Book[];
  selectedBook: Book | undefined;
  selectBook: (id: string) => void;
  addBook: (file: File) => string | null;
}

const BooksContext = createContext<BooksContextValue | null>(null);

// Files stay in memory for this visit. Replace addBook with API ingestion when available.
export function BooksProvider({ children }: { children: ReactNode }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedId, setSelectedId] = useState<string>();

  function addBook(file: File) {
    const error = validateBook(file);

    if (error) return error;

    const existing = books.find(
      (book) =>
        book.name === file.name &&
        book.size === file.size &&
        book.file.lastModified === file.lastModified,
    );
    const id = existing?.id ?? crypto.randomUUID();

    if (!existing)
      setBooks((current) => [...current, { id, name: file.name, size: file.size, file }]);

    setSelectedId(id);

    return null;
  }

  return (
    <BooksContext.Provider
      value={{
        books,
        selectedBook: books.find((book) => book.id === selectedId),
        selectBook: setSelectedId,
        addBook,
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
