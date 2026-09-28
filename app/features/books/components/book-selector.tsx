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
  const { books, selectedBook, selectBook } = useBooks();
  return (
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
        className="max-w-[min(65vw,360px)] rounded-lg border-none bg-sidebar shadow-none"
      >
        <BookOpen className="size-4 text-primary" />
        <SelectValue placeholder="Choose a book" />
      </SelectTrigger>
      <SelectContent position="popper">
        {books.map((book) => (
          <SelectItem key={book.id} value={book.id}>
            {book.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
