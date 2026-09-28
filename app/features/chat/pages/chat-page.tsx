import { useState } from "react";
import { useBooks } from "~/features/books/books-context";
import { BookSelector } from "~/features/books/components/book-selector";
import { BookUploadButton } from "~/features/books/components/book-upload-button";
import { useChat } from "../chat-context";
import { ChatComposer } from "../components/chat-composer";
import { ChatWelcome } from "../components/chat-welcome";
import { MessageList } from "../components/message-list";
import { PromptSuggestions } from "../components/prompt-suggestions";

export function ChatPage() {
  const { session } = useChat();
  return <ChatSession key={session} />;
}

function ChatSession() {
  const [draft, setDraft] = useState("");
  const { selectedBook } = useBooks();
  const { messages, sendMessage, newChat } = useChat();
  const hasMessages = messages.length > 0;
  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center justify-between gap-3 px-6 py-5 sm:px-9">
        <BookSelector onChange={newChat} />
        <span className="rounded-full border px-2.5 py-1 text-[10px] font-medium tracking-wide text-muted-foreground">
          PREVIEW
        </span>
      </header>
      <section
        aria-label="Book chat"
        className={`mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 pb-10 sm:px-9 ${hasMessages ? "justify-end" : "justify-center pt-10 lg:pt-0"}`}
      >
        {hasMessages ? <MessageList messages={messages} /> : <ChatWelcome />}
        <ChatComposer
          value={draft}
          onChange={setDraft}
          bookName={selectedBook?.name}
          onSend={() => {
            if (selectedBook) {
              sendMessage(draft);
              setDraft("");
            }
          }}
        />
        {!hasMessages && (
          <>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <BookUploadButton variant="outline" onAdded={newChat} />
              <span className="text-xs text-muted-foreground">PDF · up to 100 MB</span>
            </div>
            <PromptSuggestions onSelect={setDraft} />
          </>
        )}
      </section>
      <footer className="px-6 pb-5 text-center text-[11px] text-muted-foreground">
        Made for thoughtful reading.
      </footer>
    </div>
  );
}
