import type { UIMessage } from "ai";
import type * as v from "valibot";
import type {
  CitationSourceSchema,
  CitationDataSchema,
  ChatStatusSchema,
  BookSearchInputSchema,
  BookSearchOutputSchema,
} from "./schemas";

export type CitationSource = v.InferOutput<typeof CitationSourceSchema>;
export type CitationData = v.InferOutput<typeof CitationDataSchema>;
export type ChatStatus = v.InferOutput<typeof ChatStatusSchema>;
export type BookSearchInput = v.InferOutput<typeof BookSearchInputSchema>;
export type BookSearchOutput = v.InferOutput<typeof BookSearchOutputSchema>;

export type ChatMessage = UIMessage<
  unknown,
  { status: ChatStatus; citations: CitationData },
  { search_book: { input: BookSearchInput; output: BookSearchOutput } }
>;
