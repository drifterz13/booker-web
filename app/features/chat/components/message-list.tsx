import { useEffect, useRef } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "~/shared/lib/utils";
import type { ChatMessage } from "../types";
import { BookSearchCard } from "./book-search-card";

export function MessageList({ messages, busy }: { messages: ChatMessage[]; busy: boolean }) {
  const endRef = useRef<HTMLDivElement>(null);
  const followRef = useRef(true);

  useEffect(() => {
    const container = endRef.current?.closest("[data-chat-scroll]");

    if (!container) return;

    function onScroll() {
      if (container)
        followRef.current =
          container.scrollHeight - container.scrollTop - container.clientHeight < 80;
    }

    container.addEventListener("scroll", onScroll, { passive: true });

    return () => container.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (followRef.current) endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages]);

  return (
    <div
      className="space-y-block-gap py-8"
      role="log"
      aria-label="Conversation"
      aria-live="polite"
      aria-busy={busy}
    >
      {messages.map((message, messageIndex) => (
        <div key={message.id} className={cn("flex", message.role === "user" && "justify-end")}>
          <div
            className={cn(
              "min-w-0 max-w-[90%] rounded-2xl px-5 py-3 text-sm leading-7 break-words",
              message.role === "user" ? "bg-secondary" : "bg-surface-subtle",
            )}
          >
            <span className="sr-only">{message.role === "user" ? "You" : "Booker"}: </span>
            {message.parts.map((part, index) => {
              if (part.type === "text") {
                return message.role === "user" ? (
                  <p key={index} className="whitespace-pre-wrap">
                    {part.text}
                  </p>
                ) : (
                  <div
                    key={index}
                    className="[&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-secondary [&_pre]:p-3 [&_code]:text-xs [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_h1]:text-xl [&_h2]:text-lg [&_h3]:font-semibold [&_table]:block [&_table]:overflow-x-auto [&_td]:border [&_td]:px-2 [&_th]:border [&_th]:px-2"
                  >
                    <Markdown remarkPlugins={[remarkGfm]}>{part.text}</Markdown>
                  </div>
                );
              }

              if (part.type === "tool-search_book")
                return (
                  <BookSearchCard
                    key={part.toolCallId}
                    part={part}
                    busy={busy && messageIndex === messages.length - 1}
                  />
                );

              return null;
            })}
          </div>
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}
