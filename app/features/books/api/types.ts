import type * as v from "valibot";
import type {
  BookDetailSchema,
  BookSummarySchema,
  CompletedPartSchema,
  PartUrlSchema,
  UploadSchema,
} from "./schemas";

export type BookSummary = v.InferOutput<typeof BookSummarySchema>;
export type BookDetail = v.InferOutput<typeof BookDetailSchema>;
export type Upload = v.InferOutput<typeof UploadSchema>;
export type PartUrl = v.InferOutput<typeof PartUrlSchema>;
export type CompletedPart = v.InferOutput<typeof CompletedPartSchema>;
