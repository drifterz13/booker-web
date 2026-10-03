import { Button } from "~/shared/components/ui/button";
import { BookOpen } from "lucide-react";
import { BookMotion } from "~/shared/components/book-motion";
import type { BookSummary } from "../api/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/shared/components/ui/select";
import { useBooks } from "../books-context";

function unavailableLabel(book: BookSummary) {
  if (book.status === "failed") return "Upload failed";

  if (book.status === "uploading") return "Uploading";

  if (!book.active_index_id) return "Processing";

  return null;
}

export function BookSelector({ onChange }: { onChange: () => void }) {
  const { books, selectedBook, selectBook, loading, error, hasMore, loadingMore, loadMore } =
    useBooks();

  return (
    <div className="min-w-0">
      <Select
        value={selectedBook?.id ?? ""}
        disabled={books.length === 0}
        onValueChange={(id) => {
          selectBook(id);
          onChange();
        }}
      >
        <SelectTrigger
          aria-label="Book to chat with"
          className="min-w-0 max-w-[min(65vw,360px)] rounded-lg border-none bg-surface-subtle shadow-none"
        >
          {loading ? <BookMotion loading /> : <BookOpen className="size-4 text-primary" />}
          <SelectValue
            placeholder={
              loading
                ? "Loading books…"
                : books.length === 0
                  ? "No books yet"
                  : "No books ready yet"
            }
          />
        </SelectTrigger>
        <SelectContent position="popper">
          {books.map((book) => {
            const unavailable = unavailableLabel(book);

            return (
              <SelectItem key={book.id} value={book.id} disabled={Boolean(unavailable)}>
                {book.filename}
                {unavailable && ` · ${unavailable}`}
              </SelectItem>
            );
          })}
          {hasMore && (
            <Button variant="ghost" className="w-full" disabled={loadingMore} onClick={loadMore}>
              {loadingMore ? "Loading more…" : "Load more books"}
            </Button>
          )}
        </SelectContent>
      </Select>
      {error && (
        <div role="alert" className="mt-2 text-xs text-danger">
          Could not load books.
        </div>
      )}
    </div>
  );
}
