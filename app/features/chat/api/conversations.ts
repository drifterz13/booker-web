import * as v from "valibot";
import { apiRequest } from "~/shared/api/client";
import { NonEmptyStringSchema } from "~/shared/api/schemas";
import type { ChatMessage } from "../types";

const TimestampSchema = v.pipe(v.string(), v.isoTimestamp());

export const ConversationIdSchema = NonEmptyStringSchema;

const ConversationSummarySchema = v.object({
  id: NonEmptyStringSchema,
  book_id: NonEmptyStringSchema,
  title: NonEmptyStringSchema,
  created_at: TimestampSchema,
  updated_at: TimestampSchema,
});

const SavedMessageSchema = v.pipe(
  v.looseObject({
    id: NonEmptyStringSchema,
    role: v.picklist(["user", "assistant"]),
    parts: v.array(v.looseObject({ type: NonEmptyStringSchema })),
  }),
  v.transform((message) => message as unknown as ChatMessage),
);

const ConversationDetailSchema = v.object({
  ...ConversationSummarySchema.entries,
  messages: v.array(SavedMessageSchema),
});

export type ConversationSummary = v.InferOutput<typeof ConversationSummarySchema>;
export type ConversationDetail = v.InferOutput<typeof ConversationDetailSchema>;

export const CONVERSATION_PAGE_SIZE = 20;

export const conversationKeys = {
  list: ["conversations"] as const,
  detail: (bookId: string, id: string) => ["conversation", bookId, id] as const,
};

export function listConversations(signal?: AbortSignal) {
  return apiRequest("/conversations", v.array(ConversationSummarySchema), { signal });
}

export function getConversation(bookId: string, id: string, signal?: AbortSignal) {
  return apiRequest(
    `/books/${encodeURIComponent(bookId)}/conversations/${encodeURIComponent(id)}`,
    ConversationDetailSchema,
    { signal },
  );
}
