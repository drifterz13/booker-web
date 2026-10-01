import * as v from "valibot";
import { CitationEnvelopeSchema, CitationSourceSchema } from "./schemas";
import type { ChatMessage, CitationSource } from "./types";

export function messageCitations(message: ChatMessage) {
  let sources = new Map<string, CitationSource>();

  for (const part of message.parts) {
    if (part.type !== "data-citations") continue;

    // Each part is a complete snapshot, including an empty or malformed one.
    const envelope = v.safeParse(CitationEnvelopeSchema, part.data);

    sources = new Map();

    if (!envelope.success) continue;

    for (const entry of envelope.output.sources) {
      const result = v.safeParse(CitationSourceSchema, entry);

      if (result.success) sources.set(result.output.id, result.output);
    }
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
