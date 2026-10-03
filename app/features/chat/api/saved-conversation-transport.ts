import { DefaultChatTransport, type ChatTransport } from "ai";
import * as v from "valibot";
import { readApiError } from "~/shared/api/client";
import type { ChatMessage } from "../types";
import { ConversationIdSchema } from "./conversations";

async function chatFetch(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, init);

  if (!response.ok) {
    throw await readApiError(
      response,
      `Could not generate an answer (${response.status}). Please try again.`,
    );
  }

  return response;
}

export class SavedConversationTransport implements ChatTransport<ChatMessage> {
  private readonly inner: DefaultChatTransport<ChatMessage>;
  private conversationId: string | null = null;
  private pendingId: string | null = null;
  // Ignore a response if the reader switched chats while its request was in flight.
  private epoch = 0;

  constructor(basePath: string) {
    this.inner = new DefaultChatTransport<ChatMessage>({
      api: basePath,
      prepareSendMessagesRequest: ({ messages }) => {
        const latestUserMessage = [...messages]
          .reverse()
          .find((message) => message.role === "user");

        if (!latestUserMessage) throw new Error("There is no question to send.");

        return {
          api: this.conversationId
            ? `${basePath}/${encodeURIComponent(this.conversationId)}/messages`
            : basePath,
          body: { messages: [latestUserMessage] },
        };
      },
      fetch: async (input, init) => {
        const epoch = this.epoch;
        const response = await chatFetch(input, init);

        if (epoch === this.epoch && !this.conversationId) {
          const id = v.safeParse(ConversationIdSchema, response.headers.get("x-conversation-id"));

          if (!id.success) {
            throw new Error("The server did not return a conversation ID. Please retry.");
          }

          this.pendingId = id.output;
        }

        return response;
      },
    });
  }

  sendMessages(options: Parameters<ChatTransport<ChatMessage>["sendMessages"]>[0]) {
    return this.inner.sendMessages(options);
  }

  reconnectToStream(options: Parameters<ChatTransport<ChatMessage>["reconnectToStream"]>[0]) {
    return this.inner.reconnectToStream(options);
  }

  reset() {
    this.epoch++;
    this.conversationId = null;
    this.pendingId = null;
  }

  select(id: string) {
    this.epoch++;
    this.conversationId = id;
    this.pendingId = null;
  }

  discardPending() {
    this.pendingId = null;
  }

  commitPending() {
    if (this.pendingId) this.conversationId = this.pendingId;

    this.pendingId = null;

    return this.conversationId;
  }
}
