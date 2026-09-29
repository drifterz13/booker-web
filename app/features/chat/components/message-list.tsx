import { useEffect, useRef } from "react";
import { cn } from "~/shared/lib/utils";
import type { ChatMessage } from "../types";

export function MessageList({ messages }: { messages: ChatMessage[] }) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages]);

  return (
    <div className="space-y-6 py-8" role="log" aria-label="Conversation" aria-live="polite">
      {messages.map((message) => (
        <div key={message.id} className={cn("flex", message.role === "user" && "justify-end")}>
          <div
            className={cn(
              "max-w-[90%] rounded-2xl px-5 py-3 text-sm leading-7 whitespace-pre-wrap break-words",
              message.role === "user" ? "bg-secondary" : "bg-sidebar",
            )}
          >
            <span className="sr-only">{message.role === "user" ? "You" : "Booker"}: </span>
            {message.content}
          </div>
        </div>
      ))}
      <output className="block text-sm text-muted-foreground">
        Book answers aren’t available in this preview yet.
      </output>
      <div ref={endRef} />
    </div>
  );
}
