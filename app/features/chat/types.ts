import type { UIMessage } from "ai";

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
  { status: { phase: string; message: string } },
  { search_book: { input: BookSearchInput; output: BookSearchOutput } }
>;
