import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

const DEFAULT_PAGE_RATIO = 792 / 612;
const PAGE_GAP = 16;

interface PdfViewportOptions {
  initialPage: number;
  pageCount: number;
  isFullscreen: boolean;
}

export function usePdfViewport({ initialPage, pageCount, isFullscreen }: PdfViewportOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [page, setPage] = useState(initialPage);
  const [zoom, setZoom] = useState(1);
  const pageRef = useRef(page);
  const initialPositionedRef = useRef(false);
  const resizeAnchorRef = useRef<{ page: number; offset: number } | null>(null);
  const releaseAnchorRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pageWidth = width * zoom;
  // oxlint-disable-next-line react/incompatible-library -- The virtualizer owns its scroll measurements outside React Compiler memoization.
  const virtualizer = useVirtualizer({
    count: pageCount,
    getScrollElement: () => containerRef.current,
    estimateSize: () => Math.max(1, pageWidth * DEFAULT_PAGE_RATIO),
    gap: PAGE_GAP,
    overscan: 2,
    initialRect: { width: 600, height: 800 },
    useFlushSync: false,
  });

  function updatePage(next: number) {
    pageRef.current = next;
    setPage(next);
  }

  function pageItem(index: number) {
    // scrollToIndex offsets are capped at the last scroll position. Find the actual
    // item start so a short final page keeps its place during zoom and resize.
    let low = 0;
    let high = Math.max(0, Math.ceil(virtualizer.getTotalSize()) - 1);

    while (low <= high) {
      const item = virtualizer.getVirtualItemForOffset(Math.floor((low + high) / 2));

      if (!item || item.index === index) return item;

      if (item.index < index) {
        low = Math.floor((low + high) / 2) + 1;
      } else {
        high = Math.floor((low + high) / 2) - 1;
      }
    }
  }

  function saveResizeAnchor() {
    if (resizeAnchorRef.current || !virtualizer.options.count) return;

    const container = containerRef.current;

    if (!container) return;

    const currentPage = pageRef.current;
    const item = pageItem(currentPage - 1);

    if (!item?.size) return;

    resizeAnchorRef.current = {
      page: currentPage,
      offset: (container.scrollTop - item.start) / item.size,
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
    virtualizer.scrollToIndex(target - 1, { align: "start" });
  }

  function syncPageFromScroll() {
    if (resizeAnchorRef.current) return;

    const container = containerRef.current;

    if (!container) return;

    const item = virtualizer.getVirtualItemForOffset(container.scrollTop + 24);

    if (item) updatePage(item.index + 1);
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
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- ResizeObserver uses refs and the stable virtualizer instance.
  }, []);

  useEffect(() => {
    if (!pageCount || !width || initialPositionedRef.current) return;

    initialPositionedRef.current = true;
    scrollToPage(initialPage);
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- The effect runs when the document or measured width becomes available.
  }, [pageCount, width, initialPage]);

  useLayoutEffect(() => {
    virtualizer.measure();

    const anchor = resizeAnchorRef.current;
    const container = containerRef.current;

    if (!anchor || !container) return;

    const item = pageItem(anchor.page - 1);

    if (!item) return;

    container.scrollTop = item.start + anchor.offset * item.size;
    updatePage(anchor.page);

    if (releaseAnchorRef.current) clearTimeout(releaseAnchorRef.current);

    releaseAnchorRef.current = setTimeout(() => {
      resizeAnchorRef.current = null;
      releaseAnchorRef.current = null;
    }, 200);
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- These are the dimensions that change page positions.
  }, [width, zoom, isFullscreen]);

  useEffect(
    () => () => {
      if (releaseAnchorRef.current) clearTimeout(releaseAnchorRef.current);
    },
    [],
  );

  return {
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
  };
}
