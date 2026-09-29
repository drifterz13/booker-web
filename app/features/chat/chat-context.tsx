import { createContext, useContext, useState, type ReactNode } from "react";
import type { ChatMessage } from "./types";

interface ChatContextValue {
  messages: ChatMessage[];
  session: number;
  newChat: () => void;
  sendMessage: (content: string) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [session, setSession] = useState(0);

  function newChat() {
    setMessages([]);
    setSession((current) => current + 1);
  }

  function sendMessage(content: string) {
    const trimmed = content.trim();

    if (!trimmed) return;

    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: "user", content: trimmed },
    ]);
  }

  return (
    <ChatContext.Provider value={{ messages, session, newChat, sendMessage }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);

  if (!context) throw new Error("useChat must be used within ChatProvider");

  return context;
}
