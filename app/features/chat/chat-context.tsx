import { useChat, type UseChatHelpers } from "@ai-sdk/react";
import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useContext,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { useBooks } from "~/features/books/books-context";
import { apiBaseUrl } from "~/shared/api/client";
import * as v from "valibot";
import { conversationKeys, getConversation, type ConversationDetail } from "./api/conversations";
import { SavedConversationTransport } from "./api/saved-conversation-transport";
import { ChatStatusSchema } from "./schemas";
import type { ChatMessage } from "./types";

type ChatContextValue = Pick<
  UseChatHelpers<ChatMessage>,
  "messages" | "sendMessage" | "status" | "error" | "stop"
> & {
  session: number;
  newChat: () => void;
  startChatWithBook: (id: string) => void;
  openConversation: (bookId: string, id: string) => Promise<boolean>;
  activeConversationId: string | null;
  openingConversationId: string | null;
  progress: string | undefined;
  draft: string;
  setDraft: Dispatch<SetStateAction<string>>;
};

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { selectedBook, selectBook } = useBooks();
  const [draft, setDraft] = useState("");
  const [restoredConversation, setRestoredConversation] = useState<ConversationDetail | null>(null);

  return (
    <BookChatProvider
      key={selectedBook?.id ?? "none"}
      bookId={selectedBook?.id}
      draft={draft}
      setDraft={setDraft}
      restoredConversation={
        restoredConversation?.book_id === selectedBook?.id ? restoredConversation : null
      }
      selectBook={selectBook}
      restoreAcrossBooks={setRestoredConversation}
    >
      {children}
    </BookChatProvider>
  );
}

function BookChatProvider({
  children,
  bookId,
  draft,
  setDraft,
  restoredConversation,
  selectBook,
  restoreAcrossBooks,
}: {
  children: ReactNode;
  bookId: string | undefined;
  draft: string;
  setDraft: Dispatch<SetStateAction<string>>;
  restoredConversation: ConversationDetail | null;
  selectBook: (id: string | undefined) => void;
  restoreAcrossBooks: (conversation: ConversationDetail | null) => void;
}) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState(0);
  const [initialMessages, setInitialMessages] = useState<ChatMessage[]>(
    restoredConversation?.messages ?? [],
  );
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    restoredConversation?.id ?? null,
  );
  const [openingConversationId, setOpeningConversationId] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ chatId: string; message: string }>();
  const openRequestRef = useRef(0);
  const chatId = `${bookId ?? "none"}:${session}`;
  const basePath = `${apiBaseUrl}/books/${encodeURIComponent(bookId ?? "")}/conversations`;
  const [transport] = useState(() => {
    const instance = new SavedConversationTransport(basePath);

    if (restoredConversation) instance.select(restoredConversation.id);

    return instance;
  });

  const chat = useChat<ChatMessage>({
    id: chatId,
    messages: initialMessages,
    transport,
    onData: (part) => {
      if (part.type !== "data-status") return;

      const result = v.safeParse(ChatStatusSchema, part.data);

      if (result.success) setProgress({ chatId, message: result.output.message });
    },
    onFinish: ({ isAbort, isDisconnect, isError }) => {
      setProgress(undefined);

      if (isAbort || isDisconnect || isError) {
        transport.discardPending();

        return;
      }

      const conversationId = transport.commitPending();

      if (conversationId) setActiveConversationId(conversationId);

      if (bookId) {
        queryClient.invalidateQueries({ queryKey: conversationKeys.list });

        if (conversationId) {
          queryClient.invalidateQueries({
            queryKey: conversationKeys.detail(bookId, conversationId),
          });
        }
      }
    },
    onError: () => {
      transport.discardPending();
      setProgress(undefined);
    },
  });

  function newChat() {
    openRequestRef.current++;
    transport.reset();
    chat.stop();
    setActiveConversationId(null);
    setOpeningConversationId(null);
    setInitialMessages([]);
    restoreAcrossBooks(null);
    setDraft("");
    setProgress(undefined);
    setSession((current) => current + 1);
    selectBook(undefined);
  }

  function startChatWithBook(id: string) {
    newChat();
    selectBook(id);
  }

  async function openConversation(conversationBookId: string, id: string) {
    if (conversationBookId === bookId && id === activeConversationId) return false;

    const request = ++openRequestRef.current;

    setOpeningConversationId(id);

    try {
      const detail = await queryClient.fetchQuery({
        queryKey: conversationKeys.detail(conversationBookId, id),
        queryFn: ({ signal }) => getConversation(conversationBookId, id, signal),
        staleTime: 0,
      });

      if (request !== openRequestRef.current) return false;

      if (detail.book_id !== conversationBookId || detail.id !== id) {
        throw new Error("The selected conversation does not belong to this book.");
      }

      if (conversationBookId !== bookId) {
        restoreAcrossBooks(detail);
        selectBook(conversationBookId);

        return true;
      }

      transport.select(id);
      chat.stop();
      setActiveConversationId(id);
      setInitialMessages(detail.messages);
      restoreAcrossBooks(null);
      setDraft("");
      setProgress(undefined);
      setSession((current) => current + 1);

      return true;
    } catch {
      return false;
    } finally {
      if (request === openRequestRef.current) setOpeningConversationId(null);
    }
  }

  return (
    <ChatContext.Provider
      value={{
        ...chat,
        session,
        newChat,
        startChatWithBook,
        openConversation,
        activeConversationId,
        openingConversationId,
        progress: progress?.chatId === chatId ? progress.message : undefined,
        draft,
        setDraft,
        sendMessage: (message, options) => {
          setProgress(undefined);

          return chat.sendMessage(message, options);
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
