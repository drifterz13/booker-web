import { useEffect, useRef, useState, type RefObject } from "react";
import { Page } from "react-pdf";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { PdfPageLoading } from "./pdf-loading";

interface LazyPdfPageProps {
  document: PDFDocumentProxy;
  pageNumber: number;
  width: number;
  scrollRoot: RefObject<HTMLDivElement | null>;
}

export function LazyPdfPage({ document, pageNumber, width, scrollRoot }: LazyPdfPageProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [aspectRatio, setAspectRatio] = useState<number>();
  const [visible, setVisible] = useState(false);
  const [renderedWidth, setRenderedWidth] = useState<number>();
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    document
      .getPage(pageNumber)
      .then((page) => {
        if (!active) return;

        const viewport = page.getViewport({ scale: 1 });

        setAspectRatio(viewport.width / viewport.height);
      })
      .catch(() => {
        if (active) setError(true);
      });

    return () => {
      active = false;
    };
  }, [document, pageNumber]);

  useEffect(() => {
    const frame = frameRef.current;

    if (!frame) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { root: scrollRoot.current, rootMargin: "200px" },
    );

    observer.observe(frame);

    return () => observer.disconnect();
  }, [scrollRoot]);

  // The frame owns the dimensions; mounting the canvas and text layers cannot resize it.
  return (
    <div
      ref={frameRef}
      aria-label={`PDF page ${pageNumber}`}
      className="relative shrink-0 bg-white shadow-sm"
      style={{ width, aspectRatio: aspectRatio ?? 612 / 792 }}
    >
      {error ? (
        <p role="alert" className="p-4 text-sm text-destructive">
          This page could not be displayed.
        </p>
      ) : (
        <>
          {aspectRatio && visible && (
            <div className="absolute inset-0">
              <Page
                pageNumber={pageNumber}
                width={width}
                suspense={false}
                loading={null}
                onRenderSuccess={() => setRenderedWidth(width)}
                onRenderError={() => setError(true)}
                onLoadError={() => setError(true)}
              />
            </div>
          )}
          {renderedWidth !== width && <PdfPageLoading />}
        </>
      )}
    </div>
  );
}
