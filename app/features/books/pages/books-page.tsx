import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen } from "lucide-react";
import { Button } from "~/shared/components/ui/button";
import { BookMotion } from "~/shared/components/book-motion";
import { BookCard } from "../components/book-card";
import { BookUpload } from "../components/book-upload";
import { BOOK_PAGE_SIZE, bookListOptions } from "../queries";

export function BooksPage() {
  const [offset, setOffset] = useState(0);
  const books = useQuery({
    ...bookListOptions(offset),
    refetchInterval: (query) =>
      query.state.data?.some(
        (book) =>
          book.status === "uploading" || (book.status === "uploaded" && !book.active_index_id),
      )
        ? 3_000
        : false,
  });

  return (
    <section className="mx-auto w-full max-w-5xl px-page-gutter py-12 sm:px-page-gutter-wide">
      <div className="books-page-header flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-overline text-muted-foreground">
            Your reading space
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">My books</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            A place for your books, and the questions they inspire.
          </p>
        </div>
        <div className="flex justify-end">
          <BookUpload />
        </div>
      </div>
      {books.isPending && (
        <div className="books-page-state mt-section-gap">
          <output className="flex items-center gap-2 text-sm text-muted-foreground">
            <BookMotion loading />
            Loading your books…
          </output>
          <div aria-hidden="true" className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((index) => (
              <div key={index} className="rounded-xl border p-5">
                <div className="mb-block-gap h-32 w-24 rounded-lg bg-secondary" />
                <div className="h-4 w-3/4 rounded bg-secondary" />
                <div className="mt-2 h-3 w-1/2 rounded bg-secondary" />
              </div>
            ))}
          </div>
        </div>
      )}
      {books.isError && (
        <div role="alert" className="books-page-state mt-section-gap text-sm text-danger">
          <p>{books.error.message}</p>
          <Button
            variant="outline"
            className="mt-3"
            disabled={books.isFetching}
            onClick={() => void books.refetch()}
          >
            Retry loading books
          </Button>
        </div>
      )}
      {books.data && books.data.length === 0 && (
        <div className="books-page-state mt-section-gap flex flex-col items-center rounded-2xl border border-dashed px-6 py-20 text-center">
          <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-secondary text-primary">
            <BookOpen className="size-6" />
          </div>
          <h2 className="text-lg font-medium">
            {offset === 0 ? "Your next read starts here" : "No more books"}
          </h2>
          <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
            {offset === 0
              ? "Add a PDF to your library using the button above."
              : "Return to the previous page to see your books."}
          </p>
        </div>
      )}
      {books.data && books.data.length > 0 && (
        <div className="mt-section-gap grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {books.data.map((book, index) => (
            <BookCard key={book.id} book={book} arrivalIndex={index} />
          ))}
        </div>
      )}
      {(offset > 0 || (books.data?.length ?? 0) === BOOK_PAGE_SIZE) && (
        <nav aria-label="Book pages" className="mt-6 flex items-center gap-3">
          <Button
            variant="outline"
            disabled={offset === 0 || books.isFetching}
            onClick={() => setOffset((value) => Math.max(0, value - BOOK_PAGE_SIZE))}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">Page {offset / BOOK_PAGE_SIZE + 1}</span>
          <Button
            variant="outline"
            disabled={books.isFetching || !books.data || books.data.length < BOOK_PAGE_SIZE}
            onClick={() => setOffset((value) => value + BOOK_PAGE_SIZE)}
          >
            Next
          </Button>
        </nav>
      )}
    </section>
  );
}
