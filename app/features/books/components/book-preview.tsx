import { lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, X } from "lucide-react";
import { Button } from "~/shared/components/ui/button";
import type { BookSummary } from "../api/types";
import { bookPdfOptions } from "../queries";
import { PdfReaderLoading } from "./pdf-loading";

// The URL is fetched in the browser before loading PDF.js, which requires browser APIs.
const PdfReader = lazy(() => import("./pdf-reader"));

export function BookPreview({ book, onClose }: { book: BookSummary; onClose: () => void }) {
  const pdf = useQuery(bookPdfOptions(book.id));

  return (
    <section aria-label="PDF preview" className="flex h-full min-h-0 flex-col bg-sidebar">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white px-4">
        <FileText className="size-4 shrink-0 text-primary" />
        <h2 className="min-w-0 flex-1 truncate text-sm font-medium" title={book.filename}>
          {book.filename}
        </h2>
        <Button variant="ghost" size="icon-sm" aria-label="Close PDF preview" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </header>
      {pdf.isFetching || pdf.isPending ? (
        <PdfReaderLoading />
      ) : pdf.isError ? (
        <div role="alert" className="p-4 text-sm text-destructive">
          <p>{pdf.error.message}</p>
          <Button variant="outline" className="mt-3" onClick={() => void pdf.refetch()}>
            Retry PDF preview
          </Button>
        </div>
      ) : (
        <Suspense fallback={<PdfReaderLoading />}>
          <PdfReader
            key={pdf.data.url}
            url={pdf.data.url}
            name={book.filename}
            onRetry={() => void pdf.refetch()}
          />
        </Suspense>
      )}
    </section>
  );
}
