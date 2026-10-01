import { useEffect, useRef, useState } from "react";
import { cn } from "../lib/utils";

/** A shared book motif for the welcome entrance and pending reading states. */
export function BookMotion({
  loading = false,
  className,
}: {
  loading?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  // Let pre-rendered loading indicators animate before JavaScript hydrates.
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!loading) return;

    if (typeof IntersectionObserver === "undefined") return;

    let visible = true;

    const update = () => setPaused(document.hidden || !visible);

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    });

    if (ref.current) observer.observe(ref.current);

    document.addEventListener("visibilitychange", update);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, [loading]);

  return (
    <span
      ref={ref}
      aria-hidden="true"
      data-loading={loading}
      data-paused={paused}
      className={cn("book-motion inline-flex size-4 shrink-0 text-primary", className)}
    >
      <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
        <g className="book-motion-left">
          <path d="M16 8C12 5 7 5 3 6v19c4-1 9-1 13 2" />
          <path
            className="book-motion-ink"
            d="M6 11c2-.3 4 0 7 1M6 15c2-.3 4 0 7 1M6 19c2-.3 4 0 5 .5"
          />
        </g>
        <g className="book-motion-right">
          <path d="M16 8c4-3 9-3 13-2v19c-4-1-9-1-13 2" />
          <path
            className="book-motion-ink"
            d="M19 12c3-1 5-1.3 7-1M19 16c3-1 5-1.3 7-1M21 19.5c2-.5 3-.8 5-.5"
          />
        </g>
        <path d="M16 8v19" />
      </svg>
    </span>
  );
}
