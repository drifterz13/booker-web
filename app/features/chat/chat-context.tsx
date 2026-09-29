import { useChat, type UseChatHelpers } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useBooks } from "~/features/books/books-context";
import { apiBaseUrl, ApiError } from "~/shared/api/client";
import type { ChatMessage } from "./types";

type ChatContextValue = Pick<
  UseChatHelpers<ChatMessage>,
  "messages" | "sendMessage" | "status" | "error" | "stop" | "regenerate"
> & {
  session: number;
  newChat: () => void;
  progress: string | undefined;
};

const ChatContext = createContext<ChatContextValue | null>(null);

// Preserve readable API errors without consuming successful streaming responses.
async function chatFetch(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, init);

  if (!response.ok) {
    const body = await response.json().catch(() => null);

    throw new ApiError(
      response.status,
      typeof body?.detail === "string"
        ? body.detail
        : `Could not generate an answer (${response.status}). Please try again.`,
    );
  }

  return response;
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const { selectedBook } = useBooks();
  const [session, setSession] = useState(0);

  return (
    <BookChatProvider
      bookId={selectedBook?.id}
      session={session}
      newChat={() => setSession((current) => current + 1)}
    >
      {children}
    </BookChatProvider>
  );
}

function BookChatProvider({
  children,
  bookId,
  session,
  newChat,
}: {
  children: ReactNode;
  bookId: string | undefined;
  session: number;
  newChat: () => void;
}) {
  const chatId = `${bookId ?? "none"}:${session}`;
  const [progress, setProgress] = useState<{ chatId: string; message: string }>();
  const chat = useChat<ChatMessage>({
    id: chatId,
    transport: new DefaultChatTransport({
      api: `${apiBaseUrl}/books/${encodeURIComponent(bookId ?? "")}/chat`,
      fetch: chatFetch,
    }),
    onData: (part) => {
      if (part.type === "data-status") setProgress({ chatId, message: part.data.message });
    },
    onFinish: () => setProgress(undefined),
    onError: () => setProgress(undefined),
  });
  const { stop } = chat;

  useEffect(
    () => () => {
      void stop();
    },
    [stop],
  );

  return (
    <ChatContext.Provider
      value={{
        ...chat,
        session,
        newChat,
        progress: progress?.chatId === chatId ? progress.message : undefined,
        sendMessage: (message, options) => {
          setProgress(undefined);

          return chat.sendMessage(message, options);
        },
        regenerate: (options) => {
          setProgress(undefined);

          return chat.regenerate(options);
        },
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useBookChat() {
  const context = useContext(ChatContext);

  if (!context) throw new Error("useBookChat must be used within ChatProvider");

  return context;
}
