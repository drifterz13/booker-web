import * as v from "valibot";
import { NonEmptyStringSchema, PositiveIntegerSchema } from "~/shared/api/schemas";

export const CitationSourceSchema = v.object({
  id: NonEmptyStringSchema,
  book_id: NonEmptyStringSchema,
  index_id: NonEmptyStringSchema,
  chunk_id: NonEmptyStringSchema,
  pdf_pages: v.pipe(v.array(PositiveIntegerSchema), v.minLength(1)),
  section_path: v.array(v.string()),
});
export const CitationDataSchema = v.object({ sources: v.array(CitationSourceSchema) });
// Validate the snapshot envelope separately so one bad source does not hide valid ones.
export const CitationEnvelopeSchema = v.object({ sources: v.array(v.unknown()) });
export const ChatStatusSchema = v.object({ phase: v.string(), message: NonEmptyStringSchema });
export const BookSearchInputSchema = v.object({ query: v.string() });
export const BookSearchOutputSchema = v.object({
  book_id: NonEmptyStringSchema,
  index_id: NonEmptyStringSchema,
  passages: v.array(
    v.object({
      chunk_id: NonEmptyStringSchema,
      text: v.string(),
      section_path: v.array(v.string()),
      pdf_pages: v.array(PositiveIntegerSchema),
    }),
  ),
});
