import { useState, type CSSProperties } from "react";
import { ArrowRight, BookOpen } from "lucide-react";
import { Link } from "react-router";
import { useBooks } from "~/features/books/books-context";
import type { BookSummary } from "~/features/books/api/types";
import { BookMotion } from "~/shared/components/book-motion";
import { Button } from "~/shared/components/ui/button";

function StartBook({
  book,
  index,
  onSelect,
}: {
  book: BookSummary;
  index: number;
  onSelect: (id: string) => void;
}) {
  const [failedThumbnail, setFailedThumbnail] = useState(false);

  return (
    <li
      className="start-book-item min-w-0"
      style={{ "--book-index": Math.min(index, 6) } as CSSProperties}
    >
      <button
        type="button"
        aria-label={`Start chat with ${book.filename}`}
        onClick={() => onSelect(book.id)}
        className="start-book group flex h-full w-full flex-col rounded-lg text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
      >
        <span className="start-book-stage relative flex h-48 w-full items-end justify-center pb-4 sm:h-52">
          <span className="start-book-cover relative flex h-40 w-28 shrink-0 items-center justify-center overflow-hidden rounded-r-[5px] rounded-l-[2px] bg-secondary text-primary sm:h-44 sm:w-[7.75rem]">
            {book.thumbnail_url && !failedThumbnail ? (
              <img
                src={book.thumbnail_url}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
                onError={() => setFailedThumbnail(true)}
              />
            ) : (
              <BookOpen aria-hidden="true" className="size-10 stroke-[1.25]" />
            )}
          </span>
        </span>
        <span className="mt-4 block w-full px-1 pb-1">
          <span
            className="block w-full truncate text-sm font-medium leading-5 text-foreground"
            title={book.filename}
          >
            {book.filename}
          </span>
          <span className="start-book-action mt-2 flex items-center gap-1.5 text-xs font-semibold text-primary">
            Start chat
            <ArrowRight aria-hidden="true" className="size-3.5" />
          </span>
        </span>
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
      <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col justify-center px-page-gutter py-section-gap sm:px-page-gutter-wide">
        <BookMotion className="mb-5 size-10" />
        <h1 className="text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
          Start a chat
        </h1>
        <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground sm:text-base">
          Every conversation starts with a book. Choose one from your shelf to begin.
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
            <h2 className="mt-10 text-sm font-medium">Your books</h2>
            <ul className="mt-2 grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 sm:gap-x-8 lg:grid-cols-4">
              {readyBooks.map((book, index) => (
                <StartBook key={book.id} book={book} index={index} onSelect={onSelect} />
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
