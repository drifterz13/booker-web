import { useEffect, useState } from "react";
import { Page } from "react-pdf";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { PdfPageLoading } from "./pdf-loading";

interface LazyPdfPageProps {
  document: PDFDocumentProxy;
  pageNumber: number;
  width: number;
}

export function LazyPdfPage({ document, pageNumber, width }: LazyPdfPageProps) {
  const [aspectRatio, setAspectRatio] = useState<number>();
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

  // The frame owns the dimensions; mounting the canvas and text layers cannot resize it.
  return (
    <div
      aria-label={`PDF page ${pageNumber}`}
      data-pdf-page={pageNumber}
      className="relative shrink-0 bg-background shadow-sm"
      style={{ width, aspectRatio: aspectRatio ?? 612 / 792 }}
    >
      {error ? (
        <p role="alert" className="p-4 text-sm text-danger">
          This page could not be displayed.
        </p>
      ) : (
        <>
          {aspectRatio && (
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
