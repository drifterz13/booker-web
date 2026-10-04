import { useState } from "react";
import { ChevronLeft, ChevronRight, Maximize, Minimize, ZoomIn, ZoomOut } from "lucide-react";
import { Document, pdfjs } from "react-pdf";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { Button } from "~/shared/components/ui/button";
import { usePdfFullscreen } from "../hooks/use-pdf-fullscreen";
import { usePdfViewport } from "../hooks/use-pdf-viewport";
import { LazyPdfPage } from "./lazy-pdf-page";
import { PdfPageLoading } from "./pdf-loading";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

const PDF_OPTIONS = { disableRange: false, disableStream: true, disableAutoFetch: true };

export default function PdfReader({ url, initialPage = 1 }: { url: string; initialPage?: number }) {
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy>();
  const pages = pdfDocument?.numPages ?? 0;
  const [error, setError] = useState<string>();
  const { readerRef, isFullscreen, toggleFullscreen } = usePdfFullscreen();
  const {
    containerRef,
    virtualizer,
    pageWidth,
    page,
    zoom,
    changeZoom,
    scrollToPage,
    syncPageFromScroll,
    saveResizeAnchor,
    cancelResizeAnchor,
  } = usePdfViewport({ initialPage, pageCount: pages, isFullscreen });

  async function handleFullscreen() {
    saveResizeAnchor();

    if (!(await toggleFullscreen())) cancelResizeAnchor();
  }

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
            onClick={() => changeZoom(Math.max(0.5, zoom - 0.25))}
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
            onClick={() => changeZoom(Math.min(2, zoom + 0.25))}
          >
            <ZoomIn className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            aria-pressed={isFullscreen}
            onClick={handleFullscreen}
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
              className="relative"
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
              <div className="relative" style={{ height: virtualizer.getTotalSize() }}>
                {pdfDocument &&
                  pageWidth > 0 &&
                  virtualizer.getVirtualItems().map((item) => (
                    <div
                      key={item.key}
                      data-index={item.index}
                      ref={virtualizer.measureElement}
                      className="absolute inset-x-0 top-0 flex justify-center"
                      style={{ transform: `translateY(${item.start}px)` }}
                    >
                      <LazyPdfPage
                        document={pdfDocument}
                        pageNumber={item.index + 1}
                        width={pageWidth}
                      />
                    </div>
                  ))}
              </div>
            </Document>
          </>
        )}
      </div>
    </div>
  );
}
