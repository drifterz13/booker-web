import { lazy, Suspense } from "react";
import { FileText, X } from "lucide-react";
import { Button } from "~/shared/components/ui/button";
import { useBookUrl } from "../hooks/use-book-url";
import type { Book } from "../types";
import { PdfReaderLoading } from "./pdf-loading";

// PDF.js requires browser APIs. Loading it only after the object URL exists keeps SSR safe.
const PdfReader = lazy(() => import("./pdf-reader"));

export function BookPreview({ book, onClose }: { book: Book; onClose: () => void }) {
  const url = useBookUrl(book.file);

  return (
    <section aria-label="PDF preview" className="flex h-full min-h-0 flex-col bg-sidebar">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white px-4">
        <FileText className="size-4 shrink-0 text-primary" />
        <h2 className="min-w-0 flex-1 truncate text-sm font-medium" title={book.name}>
          {book.name}
        </h2>
        <Button variant="ghost" size="icon-sm" aria-label="Close PDF preview" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </header>
      <Suspense fallback={<PdfReaderLoading />}>
        {url ? <PdfReader key={url} url={url} name={book.name} /> : <PdfReaderLoading />}
      </Suspense>
    </section>
  );
}
