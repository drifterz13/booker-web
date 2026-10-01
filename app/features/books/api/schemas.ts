import * as v from "valibot";
import { NonEmptyStringSchema, PositiveIntegerSchema } from "~/shared/api/schemas";

export const BookSummarySchema = v.object({
  id: NonEmptyStringSchema,
  filename: NonEmptyStringSchema,
  status: v.picklist(["uploading", "uploaded", "failed"]),
  created_at: v.string(),
  active_index_id: v.optional(v.nullable(NonEmptyStringSchema)),
  thumbnail_url: v.optional(v.nullable(v.pipe(v.string(), v.url()))),
});
export const BookListSchema = v.array(BookSummarySchema);
export const BookDetailSchema = v.object({
  ...BookSummarySchema.entries,
  ingestion: v.optional(
    v.nullable(
      v.object({
        id: NonEmptyStringSchema,
        status: v.picklist(["building", "ready", "failed"]),
      }),
    ),
  ),
});
export const BookPdfSchema = v.object({
  url: v.pipe(v.string(), v.url()),
  expires_in: v.optional(v.pipe(v.number(), v.safeInteger(), v.minValue(0))),
});
export const UploadSchema = v.object({
  upload_id: NonEmptyStringSchema,
  object_key: NonEmptyStringSchema,
});
export const PartUrlSchema = v.object({
  part_number: PositiveIntegerSchema,
  ...BookPdfSchema.entries,
});
export const PartUrlsSchema = v.array(PartUrlSchema);
export const CompletedPartSchema = v.object({
  part_number: PositiveIntegerSchema,
  etag: NonEmptyStringSchema,
});
export const CompletedUploadSchema = v.object({
  object_key: NonEmptyStringSchema,
  etag: NonEmptyStringSchema,
});
export const EmptyResponseSchema = v.void();
