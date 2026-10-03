import { useState } from "react";
import { ArrowRight, BookOpen } from "lucide-react";
import { Link } from "react-router";
import { useBooks } from "~/features/books/books-context";
import type { BookSummary } from "~/features/books/api/types";
import { BookMotion } from "~/shared/components/book-motion";
import { Button } from "~/shared/components/ui/button";

function StartBookRow({ book, onSelect }: { book: BookSummary; onSelect: (id: string) => void }) {
  const [failedThumbnail, setFailedThumbnail] = useState(false);

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(book.id)}
        className="group flex min-h-20 w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-primary"
      >
        <span className="flex h-14 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-secondary text-primary">
          {book.thumbnail_url && !failedThumbnail ? (
            <img
              src={book.thumbnail_url}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
              onError={() => setFailedThumbnail(true)}
            />
          ) : (
            <BookOpen aria-hidden="true" className="size-5" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 text-sm font-medium leading-5 text-foreground">
            {book.filename}
          </span>
          <span className="mt-1 block text-xs text-muted-foreground">Start chat</span>
        </span>
        <ArrowRight
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
        />
      </button>
    </li>
  );
}

export function BookStart({ onSelect }: { onSelect: (id: string) => void }) {
  const { books, loading, error, hasMore } = useBooks();
  const readyBooks = books.filter((book) => book.status === "uploaded" && book.active_index_id);
  const processing = books.some(
    (book) => book.status === "uploading" || (book.status === "uploaded" && !book.active_index_id),
  );

  return (
    <section aria-label="Start chat" className="h-full overflow-y-auto">
      <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col justify-center px-page-gutter py-section-gap sm:px-page-gutter-wide">
        <BookMotion className="mb-4 size-12" />
        <h1 className="text-2xl leading-tight font-semibold tracking-tight sm:text-3xl">
          Start a chat
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
          Choose a book to ask questions about.
        </p>
        {loading ? (
          <output className="mt-section-gap flex items-center gap-2 text-sm text-muted-foreground">
            <BookMotion loading />
            Loading your books…
          </output>
        ) : error ? (
          <p role="alert" className="mt-section-gap text-sm text-danger">
            Could not load your books. Try again from My books.
          </p>
        ) : readyBooks.length > 0 ? (
          <>
            <h2 className="mt-section-gap text-sm font-medium">Ready to chat</h2>
            <ul className="mt-3 grid gap-x-4 sm:grid-cols-2">
              {readyBooks.map((book) => (
                <StartBookRow key={book.id} book={book} onSelect={onSelect} />
              ))}
            </ul>
            {hasMore && (
              <output className="mt-3 text-xs text-muted-foreground">Loading more books…</output>
            )}
          </>
        ) : (
          <p className="mt-section-gap text-sm leading-6 text-muted-foreground">
            {processing
              ? "Your books are still processing. They’ll appear here when ready."
              : "Add a PDF to your library to start a conversation."}
          </p>
        )}
        <div className="mt-6">
          <Button asChild variant="outline" size="sm">
            <Link to="/books">Go to My books</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
