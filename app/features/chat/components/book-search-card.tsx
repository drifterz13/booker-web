import { Search } from "lucide-react";
import type { ChatMessage } from "../types";

type SearchPart = Extract<ChatMessage["parts"][number], { type: "tool-search_book" }>;

export function BookSearchCard({ part, busy }: { part: SearchPart; busy: boolean }) {
  const complete = part.state === "output-available";
  const failed = part.state === "output-error" || part.state === "output-denied";
  const passages = complete ? part.output.passages : [];
  const label = failed
    ? "Book search failed"
    : complete
      ? passages.length === 0
        ? "No matching passages"
        : `Found ${passages.length} passages`
      : busy
        ? "Searching the book…"
        : "Book search stopped";

  return (
    <details className="my-2 rounded-lg border bg-white/60 px-3 py-2 text-xs">
      <summary className="cursor-pointer text-muted-foreground">
        <Search aria-hidden className="mr-2 inline size-3.5" />
        {label}
      </summary>
      <div className="mt-3 space-y-3">
        {part.input?.query && <p className="break-words">{part.input.query}</p>}
        {part.state === "output-error" && <p className="text-destructive">{part.errorText}</p>}
        {passages.map((passage) => (
          <blockquote
            key={passage.chunk_id}
            className="border-l-2 pl-3 leading-6 whitespace-pre-wrap"
          >
            {passage.section_path.length > 0 && (
              <p className="font-medium">{passage.section_path.join(" › ")}</p>
            )}
            {passage.text}
          </blockquote>
        ))}
      </div>
    </details>
  );
}
