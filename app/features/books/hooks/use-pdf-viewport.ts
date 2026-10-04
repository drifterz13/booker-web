import { useEffect, useLayoutEffect, useRef, useState } from "react";

interface PdfViewportOptions {
  initialPage: number;
  isReady: boolean;
  isFullscreen: boolean;
}

export function usePdfViewport({ initialPage, isReady, isFullscreen }: PdfViewportOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [page, setPage] = useState(initialPage);
  const [zoom, setZoom] = useState(1);
  const pageRef = useRef(page);
  const initialPositionedRef = useRef(false);
  const resizeAnchorRef = useRef<{ page: number; offset: number } | null>(null);
  const releaseAnchorRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function updatePage(next: number) {
    pageRef.current = next;
    setPage(next);
  }

  function saveResizeAnchor() {
    if (resizeAnchorRef.current) return;

    const container = containerRef.current;
    const currentPage = pageRef.current;
    const frame = container?.querySelector<HTMLElement>(`[data-pdf-page="${currentPage}"]`);

    if (!container || !frame) return;

    const containerTop = container.getBoundingClientRect().top;
    const frameBounds = frame.getBoundingClientRect();

    if (!frameBounds.height) return;

    resizeAnchorRef.current = {
      page: currentPage,
      offset: (containerTop - frameBounds.top) / frameBounds.height,
    };
  }

  function cancelResizeAnchor() {
    resizeAnchorRef.current = null;

    if (releaseAnchorRef.current) clearTimeout(releaseAnchorRef.current);

    releaseAnchorRef.current = null;
  }

  function changeZoom(next: number) {
    saveResizeAnchor();
    setZoom(next);
  }

  function scrollToPage(target: number) {
    cancelResizeAnchor();
    updatePage(target);

    const container = containerRef.current;
    const frame = container?.querySelector<HTMLElement>(`[data-pdf-page="${target}"]`);

    if (!container || !frame) return;

    container.scrollTop +=
      frame.getBoundingClientRect().top - container.getBoundingClientRect().top;
  }

  function syncPageFromScroll() {
    if (resizeAnchorRef.current) return;

    const container = containerRef.current;

    if (!container) return;

    const top = container.getBoundingClientRect().top + 24;
    const frames = container.querySelectorAll<HTMLElement>("[data-pdf-page]");

    for (const frame of frames) {
      if (frame.getBoundingClientRect().bottom > top) {
        updatePage(Number(frame.dataset.pdfPage));

        return;
      }
    }
  }

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;

      saveResizeAnchor();
      setWidth(Math.max(1, entry.contentRect.width));
    });

    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isReady || !width || initialPositionedRef.current) return;

    initialPositionedRef.current = true;
    scrollToPage(initialPage);
  }, [isReady, width, initialPage]);

  useLayoutEffect(() => {
    const anchor = resizeAnchorRef.current;
    const container = containerRef.current;
    const frame = container?.querySelector<HTMLElement>(`[data-pdf-page="${anchor?.page}"]`);

    if (!anchor || !container || !frame) return;

    const frameBounds = frame.getBoundingClientRect();

    container.scrollTop +=
      frameBounds.top - container.getBoundingClientRect().top + anchor.offset * frameBounds.height;
    updatePage(anchor.page);

    if (releaseAnchorRef.current) clearTimeout(releaseAnchorRef.current);

    releaseAnchorRef.current = setTimeout(() => {
      resizeAnchorRef.current = null;
      releaseAnchorRef.current = null;
    }, 200);
  }, [width, zoom, isFullscreen]);

  useEffect(
    () => () => {
      if (releaseAnchorRef.current) clearTimeout(releaseAnchorRef.current);
    },
    [],
  );

  return {
    containerRef,
    width,
    page,
    zoom,
    changeZoom,
    scrollToPage,
    syncPageFromScroll,
    saveResizeAnchor,
    cancelResizeAnchor,
  };
}
