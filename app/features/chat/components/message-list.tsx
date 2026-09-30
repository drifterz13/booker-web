import { useEffect, useRef, type ReactNode } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "~/shared/lib/utils";
import { Button } from "~/shared/components/ui/button";
import { citationDescription, citationPageLabel, messageCitations } from "../citations";
import type { ChatMessage, CitationSource } from "../types";
import { BookSearchCard } from "./book-search-card";

export function MessageList({
  messages,
  busy,
  children,
  onCitation,
}: {
  messages: ChatMessage[];
  busy: boolean;
  children?: ReactNode;
  onCitation?: (source: CitationSource) => void;
}) {
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
      className="space-y-6 py-5"
      role="log"
      aria-label="Conversation"
      aria-live="polite"
      aria-busy={busy}
    >
      {messages.map((message, messageIndex) => {
        const sources = messageCitations(message);

        return (
          <div key={message.id} className={cn("flex", message.role === "user" && "justify-end")}>
            <div
              className={cn(
                "min-w-0 text-base leading-7 break-words",
                message.role === "user"
                  ? "max-w-[85%] rounded-2xl bg-secondary px-4 py-2"
                  : "w-full max-w-[72ch]",
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
                      <Markdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          a: ({ href, children }) => {
                            if (!href?.startsWith("#cite-")) return <a href={href}>{children}</a>;

                            const id = /^#cite-([A-Za-z0-9_-]+)$/.exec(href)?.[1];
                            const source = id ? sources.get(id) : undefined;

                            if (!source || !onCitation) return <>{children}</>;

                            const description = citationDescription(source);

                            return (
                              <Button
                                type="button"
                                variant="link"
                                size="xs"
                                className="inline h-auto rounded-sm p-0 align-baseline text-base leading-[inherit] font-semibold underline decoration-primary/40 decoration-1 underline-offset-2 hover:decoration-primary"
                                title={description}
                                aria-label={`Open citation: ${description}`}
                                onClick={() => onCitation(source)}
                              >
                                {citationPageLabel(source)}
                              </Button>
                            );
                          },
                        }}
                      >
                        {part.text}
                      </Markdown>
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
        );
      })}
      {children}
      <div ref={endRef} />
    </div>
  );
}
