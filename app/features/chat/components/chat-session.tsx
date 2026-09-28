import { useState } from "react";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { useBooks } from "~/features/books/books-context";
import { BookSelector } from "~/features/books/components/book-selector";
import { BookUploadButton } from "~/features/books/components/book-upload-button";
import { Button } from "~/shared/components/ui/button";
import { useChat } from "../chat-context";
import { ChatComposer } from "./chat-composer";
import { ChatWelcome } from "./chat-welcome";
import { MessageList } from "./message-list";
import { PromptSuggestions } from "./prompt-suggestions";

export function ChatSession({
  onTogglePreview,
  previewOpen,
}: {
  onTogglePreview: () => void;
  previewOpen: boolean;
}) {
  const [draft, setDraft] = useState("");
  const { selectedBook } = useBooks();
  const { messages, sendMessage, newChat } = useChat();
  const hasMessages = messages.length > 0;
  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center justify-between gap-3 px-6 py-5 sm:px-9">
        <BookSelector onChange={newChat} />
        {selectedBook ? (
          <Button
            variant="ghost"
            size="sm"
            aria-label={previewOpen ? "Hide PDF preview" : "Show PDF preview"}
            onClick={onTogglePreview}
          >
            {previewOpen ? (
              <PanelRightClose className="size-4" />
            ) : (
              <PanelRightOpen className="size-4" />
            )}
            <span className="hidden @min-[440px]:inline">
              {previewOpen ? "Hide PDF" : "View PDF"}
            </span>
          </Button>
        ) : (
          <span className="rounded-full border px-2.5 py-1 text-[10px] font-medium tracking-wide text-muted-foreground">
            PREVIEW
          </span>
        )}
      </header>
      <section
        aria-label="Book chat"
        className={`mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 pb-10 @min-[640px]:px-9 ${hasMessages ? "justify-end" : "justify-center pt-10 @min-[800px]:pt-0"}`}
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
