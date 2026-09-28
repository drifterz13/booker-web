import { ArrowUpRight, BookOpen } from "lucide-react";
import { Button } from "~/shared/components/ui/button";
import { formatBookSize } from "../lib/validate-book";
import type { Book } from "../types";

export function BookCard({ book, onOpen }: { book: Book; onOpen: () => void }) {
  return (
    <article className="flex flex-col rounded-xl border bg-white p-5 transition-shadow hover:shadow-sm">
      <div className="mb-6 flex items-start justify-between">
        <div className="flex size-12 items-center justify-center rounded-xl bg-secondary text-primary">
          <BookOpen className="size-6" />
        </div>
        <span className="rounded-md bg-sidebar px-2 py-1 text-[10px] font-medium tracking-wider text-muted-foreground">
          PDF
        </span>
      </div>
      <h2 className="break-words text-sm font-medium">{book.name}</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        {formatBookSize(book.size)} · Selected locally
      </p>
      <Button variant="ghost" onClick={onOpen} className="mt-5 w-full justify-between">
        Open chat <ArrowUpRight className="size-4" />
      </Button>
    </article>
  );
}
