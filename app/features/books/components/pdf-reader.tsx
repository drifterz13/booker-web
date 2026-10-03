import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize, Minimize, ZoomIn, ZoomOut } from "lucide-react";
import { Document, pdfjs } from "react-pdf";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { toast } from "sonner";
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

export default function PdfReader({ url, initialPage = 1 }: { url: string; initialPage?: number }) {
  const readerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy>();
  const pages = pdfDocument?.numPages ?? 0;
  const [page, setPage] = useState(initialPage);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState<string>();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const initialPositionedRef = useRef(false);

  function scrollToPage(target: number) {
    setPage(target);

    const container = containerRef.current;
    const frame = container?.querySelector<HTMLElement>(`[data-pdf-page="${target}"]`);

    if (!container || !frame) return;

    container.scrollTop +=
      frame.getBoundingClientRect().top - container.getBoundingClientRect().top;
  }

  function syncPageFromScroll() {
    const container = containerRef.current;

    if (!container) return;

    const top = container.getBoundingClientRect().top + 24;
    const frames = container.querySelectorAll<HTMLElement>("[data-pdf-page]");

    for (const frame of frames) {
      if (frame.getBoundingClientRect().bottom > top) {
        setPage(Number(frame.dataset.pdfPage));

        return;
      }
    }
  }

  useEffect(() => {
    const syncFullscreen = () => setIsFullscreen(document.fullscreenElement === readerRef.current);

    document.addEventListener("fullscreenchange", syncFullscreen);

    return () => document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

  async function toggleFullscreen() {
    if (!isFullscreen && !readerRef.current?.requestFullscreen) {
      toast.error("Fullscreen is unavailable in this browser.");

      return;
    }

    try {
      if (isFullscreen) {
        await document.exitFullscreen();
      } else {
        await readerRef.current!.requestFullscreen();
      }
    } catch {
      toast.error("Could not change fullscreen mode.");
    }
  }

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
    if (!pdfDocument || !width || initialPositionedRef.current) return;

    initialPositionedRef.current = true;
    scrollToPage(initialPage);
  }, [pdfDocument, width, initialPage]);

  return (
    <div ref={readerRef} className="pdf-reader flex min-h-0 flex-1 flex-col bg-surface-subtle">
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
            onClick={() => scrollToPage(page - 1)}
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
            onClick={() => scrollToPage(page + 1)}
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
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            aria-pressed={isFullscreen}
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
          </Button>
        </div>
      </div>
      <div
        ref={containerRef}
        className="min-h-0 flex-1 overflow-auto p-4"
        onScroll={syncPageFromScroll}
        style={{ scrollbarGutter: "stable" }}
      >
        {error ? (
          <div role="alert" className="text-sm text-danger">
            <p>{error}</p>
          </div>
        ) : (
          <>
            {!pdfDocument && (
              <div className="relative aspect-[612/792] w-full bg-background shadow-sm">
                <PdfPageLoading />
              </div>
            )}
            <Document
              className="flex flex-col items-center gap-4"
              file={url}
              options={PDF_OPTIONS}
              suspense={false}
              onLoadSuccess={(loaded) => {
                setPdfDocument(loaded);

                if (initialPage > loaded.numPages) {
                  setError(`The cited page ${initialPage} is not available in this PDF.`);
                }
              }}
              onLoadError={() =>
                setError("This PDF could not be opened. It may be damaged or unsupported.")
              }
              onSourceError={() =>
                setError("This PDF could not be read. Try reopening the preview.")
              }
              onPassword={() =>
                setError("This PDF is password protected. Select an unlocked copy to preview it.")
              }
              loading={null}
              error={null}
            >
              {pdfDocument &&
                width > 0 &&
                Array.from({ length: pages }, (_, index) => (
                  <LazyPdfPage
                    key={index + 1}
                    document={pdfDocument}
                    pageNumber={index + 1}
                    width={width * zoom}
                    scrollRoot={containerRef}
                  />
                ))}
            </Document>
          </>
        )}
      </div>
    </div>
  );
}
