import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Scan, ZoomIn, ZoomOut } from "lucide-react";
import { Document, pdfjs } from "react-pdf";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { Button } from "~/shared/components/ui/button";
import { LazyPdfPage } from "./lazy-pdf-page";
import { PdfPageLoading } from "./pdf-loading";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

const PDF_OPTIONS = { disableRange: true };

export default function PdfReader({
  url,
  name,
  onRetry,
}: {
  url: string;
  name: string;
  onRetry?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [document, setDocument] = useState<PDFDocumentProxy>();
  const pages = document?.numPages ?? 0;
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(Math.max(1, entry.contentRect.width));
    });

    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
      containerRef.current.scrollLeft = 0;
    }
  }, [page]);

  return (
    <>
      <div
        aria-label="PDF controls"
        className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b bg-background px-3 py-2"
      >
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Previous page"
            disabled={page <= 1 || !pages || Boolean(error)}
            onClick={() => setPage((current) => current - 1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-16 text-center text-xs text-muted-foreground" aria-live="polite">
            {pages ? `${page} / ${pages}` : "— / —"}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Next page"
            disabled={page >= pages || !pages || Boolean(error)}
            onClick={() => setPage((current) => current + 1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Zoom out"
            disabled={!pages || zoom <= 0.5 || Boolean(error)}
            onClick={() => setZoom((current) => Math.max(0.5, current - 0.25))}
          >
            <ZoomOut className="size-4" />
          </Button>
          <span className="min-w-10 text-center text-caption text-muted-foreground">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Zoom in"
            disabled={!pages || zoom >= 2 || Boolean(error)}
            onClick={() => setZoom((current) => Math.min(2, current + 0.25))}
          >
            <ZoomIn className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Fit page to width"
            disabled={!pages || Boolean(error)}
            onClick={() => setZoom(1)}
          >
            <Scan className="size-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" asChild>
            <a href={url} download={name} aria-label="Download PDF">
              <Download className="size-4" />
            </a>
          </Button>
        </div>
      </div>
      <div
        ref={containerRef}
        className="min-h-0 flex-1 overflow-auto p-4"
        style={{ scrollbarGutter: "stable" }}
      >
        {error ? (
          <div role="alert" className="text-sm text-danger">
            <p>{error}</p>
            {onRetry && (
              <Button variant="outline" className="mt-3" onClick={onRetry}>
                Retry PDF preview
              </Button>
            )}
          </div>
        ) : (
          <Document
            file={url}
            options={PDF_OPTIONS}
            suspense={false}
            onLoadSuccess={setDocument}
            onLoadError={() =>
              setError("This PDF could not be opened. It may be damaged or unsupported.")
            }
            onSourceError={() => setError("This PDF could not be read. Try reopening the preview.")}
            onPassword={() =>
              setError("This PDF is password protected. Select an unlocked copy to preview it.")
            }
            loading={
              <div className="relative aspect-[612/792] w-full bg-background shadow-sm">
                <PdfPageLoading />
              </div>
            }
            error={
              <p role="alert" className="text-sm text-danger">
                {error ?? "This PDF could not be opened."}
              </p>
            }
          >
            {document && width > 0 && (
              <LazyPdfPage
                key={page}
                document={document}
                pageNumber={page}
                width={width * zoom}
                scrollRoot={containerRef}
              />
            )}
          </Document>
        )}
      </div>
    </>
  );
}
