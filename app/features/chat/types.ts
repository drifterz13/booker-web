import type { UIMessage } from "ai";

export interface CitationSource {
  id: string;
  book_id: string;
  index_id: string;
  chunk_id: string;
  pdf_pages: number[];
  section_path: string[];
}

export interface CitationData {
  sources: CitationSource[];
}

export interface BookSearchInput {
  query: string;
}

export interface BookSearchOutput {
  book_id: string;
  index_id: string;
  passages: {
    chunk_id: string;
    text: string;
    section_path: string[];
    pdf_pages: number[];
  }[];
}

export type ChatMessage = UIMessage<
  unknown,
  { status: { phase: string; message: string }; citations: CitationData },
  { search_book: { input: BookSearchInput; output: BookSearchOutput } }
>;
