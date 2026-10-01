export function PdfPageLoading() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background text-sm text-muted-foreground">
      <output className="flex flex-col items-center gap-3">
        <BookMotion loading className="size-8" />
        Loading page…
      </output>
    </div>
  );
}

export function PdfReaderLoading() {
  return (
    <>
      <div
        aria-hidden="true"
        className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b bg-background px-3 py-2"
      >
        <div className="h-8 w-34 rounded bg-secondary" />
        <div className="h-8 w-44 rounded bg-secondary" />
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-4" style={{ scrollbarGutter: "stable" }}>
        <div className="relative aspect-[612/792] w-full bg-background shadow-sm">
          <PdfPageLoading />
        </div>
      </div>
    </>
  );
}
import { BookMotion } from "~/shared/components/book-motion";
