import { Button } from "~/shared/components/ui/button";
import { BookOpen } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/shared/components/ui/select";
import { useBooks } from "../books-context";

export function BookSelector({ onChange }: { onChange: () => void }) {
  const { books, selectedBook, selectBook, loading, error, hasMore, loadingMore, loadMore, retry } =
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
          <BookOpen className="size-4 text-primary" />
          <SelectValue
            placeholder={
              loading ? "Loading books…" : books.length === 0 ? "No books yet" : "Choose a book"
            }
          />
        </SelectTrigger>
        <SelectContent position="popper">
          {books.map((book) => (
            <SelectItem key={book.id} value={book.id} disabled={book.status !== "uploaded"}>
              {book.filename}
            </SelectItem>
          ))}
          {hasMore && (
            <Button variant="ghost" className="w-full" disabled={loadingMore} onClick={loadMore}>
              {loadingMore ? "Loading more…" : "Load more books"}
            </Button>
          )}
        </SelectContent>
      </Select>
      {error && (
        <div role="alert" className="mt-2 text-xs text-danger">
          Could not load books.{" "}
          <Button variant="ghost" size="sm" onClick={retry}>
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}
