import { BookOpen } from "lucide-react";
import { useState } from "react";
import type { BookSummary } from "../api/types";

const statusLabels = { uploading: "Uploading", uploaded: "Uploaded", failed: "Upload failed" };

export function BookCard({ book }: { book: BookSummary }) {
  const [failedThumbnail, setFailedThumbnail] = useState<string>();

  return (
    <article className="flex flex-col rounded-xl border bg-white p-5 transition-shadow hover:shadow-sm">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex h-32 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary text-primary">
          {book.thumbnail_url && failedThumbnail !== book.thumbnail_url ? (
            <img
              src={book.thumbnail_url}
              alt={`Cover of ${book.filename}`}
              loading="lazy"
              className="h-full w-full object-cover"
              onError={() => setFailedThumbnail(book.thumbnail_url ?? undefined)}
            />
          ) : (
            <BookOpen className="size-8" />
          )}
        </div>
        <span className="rounded-md bg-sidebar px-2 py-1 text-xs text-muted-foreground">
          {statusLabels[book.status]}
        </span>
      </div>
      <h2 className="break-words text-sm font-medium">{book.filename}</h2>
      <p className="mt-2 text-xs text-muted-foreground">
        PDF · Added {new Date(book.created_at).toLocaleDateString()}
      </p>
    </article>
  );
}
