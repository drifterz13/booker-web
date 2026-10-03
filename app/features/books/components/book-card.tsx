import { ArrowRight, BookOpen } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { useBookChat } from "~/features/chat/chat-context";
import { Button } from "~/shared/components/ui/button";
import { cn } from "~/shared/lib/utils";
import type { BookSummary } from "../api/types";

function bookStatus(book: BookSummary) {
  if (book.status === "failed") return "Upload failed";

  if (book.status === "uploading") return "Uploading";

  return book.active_index_id ? "Ready to chat" : "Processing";
}

export function BookCard({ book, arrivalIndex = 0 }: { book: BookSummary; arrivalIndex?: number }) {
  const [failedThumbnail, setFailedThumbnail] = useState<string>();
  const { startChatWithBook } = useBookChat();
  const ready = book.status === "uploaded" && Boolean(book.active_index_id);
  const processing = book.status === "uploaded" && !book.active_index_id;

  return (
    <article
      className="book-card flex flex-col rounded-xl border bg-background p-5"
      style={{ animationDelay: `${Math.min(arrivalIndex, 5) * 30}ms` }}
    >
      <div className="mb-block-gap flex items-start justify-between gap-4">
        <div className="flex h-32 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary text-primary">
          {book.thumbnail_url && failedThumbnail !== book.thumbnail_url ? (
            <img
              src={book.thumbnail_url}
              alt={`Cover of ${book.filename}`}
              loading="lazy"
              className="book-cover h-full w-full object-cover"
              onError={() => setFailedThumbnail(book.thumbnail_url ?? undefined)}
            />
          ) : (
            <BookOpen className="size-8" />
          )}
        </div>
        <span
          key={bookStatus(book)}
          className={cn(
            "book-status rounded-md px-2 py-1 text-xs",
            book.status === "failed" && "bg-danger/10 text-danger",
            book.status === "uploading" && "bg-surface-subtle text-muted-foreground",
            ready && "bg-success-subtle font-medium text-success",
            processing && "bg-warning-subtle font-medium text-warning",
          )}
        >
          {bookStatus(book)}
        </span>
      </div>
      <h2 className="break-words text-sm font-medium">{book.filename}</h2>
      <p className="mt-2 text-xs text-muted-foreground">
        PDF · Added {new Date(book.created_at).toLocaleDateString()}
      </p>
      {ready && (
        <div className="mt-auto pt-5">
          <Button asChild size="lg" className="w-full justify-between">
            <Link
              to="/"
              aria-label={`Start chat with ${book.filename}`}
              onClick={() => startChatWithBook(book.id)}
            >
              Start chat
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </Button>
        </div>
      )}
    </article>
  );
}
