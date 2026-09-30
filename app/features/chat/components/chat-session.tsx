import { useState } from "react";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { useBooks } from "~/features/books/books-context";
import { BookSelector } from "~/features/books/components/book-selector";
import { Button } from "~/shared/components/ui/button";
import { useBookChat } from "../chat-context";
import { ChatComposer } from "./chat-composer";
import { ChatWelcome } from "./chat-welcome";
import { MessageList } from "./message-list";
import { PromptSuggestions } from "./prompt-suggestions";

export function ChatSession({
  onTogglePreview,
  onBookSelected,
  previewOpen,
}: {
  onTogglePreview: () => void;
  onBookSelected: () => void;
  previewOpen: boolean;
}) {
  const [draft, setDraft] = useState("");
  const { selectedBook, retry: refreshBooks } = useBooks();
  const { messages, sendMessage, status, error, stop, regenerate, progress } = useBookChat();
  const busy = status === "submitted" || status === "streaming";
  const ready = Boolean(selectedBook?.active_index_id);
  const hasMessages = messages.length > 0;

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center justify-between gap-3 px-page-gutter py-5 sm:px-page-gutter-wide">
        <BookSelector
          onChange={() => {
            setDraft("");
            onBookSelected();
          }}
        />
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
          <span className="rounded-full border px-2.5 py-1 text-overline font-medium tracking-overline text-muted-foreground">
            PREVIEW
          </span>
        )}
      </header>
      <section
        aria-label="Book chat"
        className={`mx-auto flex w-full max-w-3xl flex-1 flex-col px-page-gutter pb-section-gap @min-[640px]:px-page-gutter-wide ${hasMessages ? "justify-end" : "justify-center pt-section-gap @min-[800px]:pt-0"}`}
      >
        {hasMessages ? <MessageList messages={messages} busy={busy} /> : <ChatWelcome />}
        {busy && (
          <output className="mb-4 block text-sm text-muted-foreground">
            {progress ?? (status === "submitted" ? "Thinking…" : "Answering…")}
          </output>
        )}
        {selectedBook && !ready && (
          <Button variant="ghost" size="sm" onClick={refreshBooks} className="mb-3 self-start">
            Check book readiness
          </Button>
        )}
        {error && (
          <div
            role="alert"
            className="mb-4 flex items-center justify-between gap-3 text-sm text-danger"
          >
            <p>{error.message}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void regenerate();
              }}
            >
              Retry
            </Button>
          </div>
        )}
        <ChatComposer
          value={draft}
          onChange={setDraft}
          bookName={selectedBook?.filename}
          busy={busy}
          ready={ready}
          onStop={() => {
            void stop();
          }}
          onSend={() => {
            if (selectedBook && ready && !busy && draft.trim()) {
              void sendMessage({ text: draft.trim() });
              setDraft("");
            }
          }}
        />
        {!hasMessages && (
          <>
            <PromptSuggestions onSelect={setDraft} />
          </>
        )}
      </section>
      <footer className="px-page-gutter pb-5 text-center text-caption text-muted-foreground sm:px-page-gutter-wide">
        Made for thoughtful reading.
      </footer>
    </div>
  );
}
