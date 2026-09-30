import type { ChatMessage, CitationSource } from "./types";

function isCitationSource(value: unknown): value is CitationSource {
  if (!value || typeof value !== "object") return false;

  const source = value as Record<string, unknown>;

  return (
    [source.id, source.book_id, source.index_id, source.chunk_id].every(
      (field) => typeof field === "string" && field.trim().length > 0,
    ) &&
    Array.isArray(source.pdf_pages) &&
    source.pdf_pages.length > 0 &&
    source.pdf_pages.every((page) => Number.isSafeInteger(page) && page > 0) &&
    Array.isArray(source.section_path) &&
    source.section_path.every((section) => typeof section === "string")
  );
}

export function messageCitations(message: ChatMessage) {
  let sources = new Map<string, CitationSource>();

  for (const part of message.parts) {
    if (part.type !== "data-citations") continue;

    // Each part is a complete snapshot, including an empty or malformed one.
    const entries: unknown = part.data?.sources;

    sources = new Map(
      Array.isArray(entries)
        ? entries.filter(isCitationSource).map((source) => [source.id, source])
        : [],
    );
  }

  return sources;
}

export function citationDescription(source: CitationSource) {
  const pages = `${source.pdf_pages.length === 1 ? "Page" : "Pages"} ${source.pdf_pages.join(", ")}`;

  return [pages, ...source.section_path].join(" · ");
}

export function citationPageLabel(source: CitationSource) {
  const pages = Array.from(new Set(source.pdf_pages));
  const consecutive = pages.every((page, index) => index === 0 || page === pages[index - 1] + 1);
  const label =
    pages.length > 1 && consecutive ? `${pages[0]}–${pages[pages.length - 1]}` : pages.join(", ");

  return `${pages.length === 1 ? "p." : "pp."} ${label}`;
}
