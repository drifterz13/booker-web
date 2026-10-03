import { lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, X } from "lucide-react";
import { Button } from "~/shared/components/ui/button";
import type { BookSummary } from "../api/types";
import { bookPdfOptions } from "../queries";
import { PdfReaderLoading } from "./pdf-loading";

// The URL is fetched in the browser before loading PDF.js, which requires browser APIs.
const PdfReader = lazy(() => import("./pdf-reader"));

export interface CitationNavigation {
  requestId: number;
  pages: number[];
}

export function BookPreview({
  book,
  onClose,
  citation,
}: {
  book: Pick<BookSummary, "id" | "filename">;
  onClose: () => void;
  citation?: CitationNavigation;
}) {
  const options = bookPdfOptions(book.id);
  const pdf = useQuery(
    citation
      ? {
          ...options,
          // A new click always fetches a fresh signed URL. Do not retain it after closing.
          queryKey: [...options.queryKey, "citation", String(citation.requestId)],
          gcTime: 0,
          staleTime: 0,
        }
      : options,
  );

  return (
    <section aria-label="PDF preview" className="flex h-full min-h-0 flex-col bg-surface-subtle">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
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
        <div role="alert" className="p-4 text-sm text-danger">
          <p>{pdf.error.message}</p>
        </div>
      ) : (
        <Suspense fallback={<PdfReaderLoading />}>
          <PdfReader
            key={`${pdf.data.url}:${citation?.requestId ?? "preview"}`}
            url={pdf.data.url}
            name={book.filename}
            initialPage={citation?.pages[0]}
          />
        </Suspense>
      )}
    </section>
  );
}
