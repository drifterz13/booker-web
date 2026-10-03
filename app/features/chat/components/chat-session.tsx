import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { useBooks } from "~/features/books/books-context";
import { BookSelector } from "~/features/books/components/book-selector";
import { Button } from "~/shared/components/ui/button";
import { BookMotion } from "~/shared/components/book-motion";
import { useBookChat } from "../chat-context";
import { BookStart } from "./book-start";
import { ChatComposer } from "./chat-composer";
import { ChatWelcome } from "./chat-welcome";
import { MessageList } from "./message-list";
import { PromptSuggestions } from "./prompt-suggestions";
import type { CitationSource } from "../types";

export function ChatSession({
  onTogglePreview,
  onBookSelected,
  previewOpen,
  onCitation,
}: {
  onTogglePreview: () => void;
  onBookSelected: () => void;
  previewOpen: boolean;
  onCitation: (source: CitationSource) => void;
}) {
  const { selectedBook } = useBooks();
  const {
    messages,
    sendMessage,
    status,
    error,
    stop,
    progress,
    draft,
    setDraft,
    startChatWithBook,
  } = useBookChat();
  const busy = status === "submitted" || status === "streaming";
  const hasMessages = messages.length > 0;
  const hasStatus = busy || error;
  const statusContent = (
    <>
      {busy && (
        <output className="flex items-center gap-2 text-sm text-muted-foreground">
          <BookMotion loading />
          {progress ?? (status === "submitted" ? "Thinking…" : "Answering…")}
        </output>
      )}
      {error && (
        <div role="alert" className="flex items-center justify-between gap-3 text-sm text-danger">
          <p>{error.message}</p>
        </div>
      )}
    </>
  );

  if (!selectedBook) {
    return (
      <BookStart
        onSelect={(id) => {
          startChatWithBook(id);
          onBookSelected();
        }}
      />
    );
  }

  return (
    <div
      className={`flex h-full min-h-0 flex-col ${hasMessages ? "overflow-hidden" : "overflow-y-auto"}`}
    >
      <header className="flex shrink-0 items-center justify-between gap-3 px-page-gutter py-3 sm:px-page-gutter-wide">
        <BookSelector
          onChange={(id) => {
            startChatWithBook(id);
            onBookSelected();
          }}
        />
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
      </header>
      <section
        aria-label="Book chat"
        className={`mx-auto flex w-full max-w-4xl flex-1 flex-col px-page-gutter pb-4 @min-[640px]:px-page-gutter-wide ${hasMessages ? "min-h-0" : "chat-intro justify-center pt-section-gap @min-[800px]:pt-0"}`}
      >
        {hasMessages ? (
          <div data-chat-scroll className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-4">
            <MessageList messages={messages} busy={busy} onCitation={onCitation}>
              {statusContent}
            </MessageList>
          </div>
        ) : (
          <>
            <ChatWelcome />
            {hasStatus && <div className="mb-4 flex flex-col gap-3">{statusContent}</div>}
          </>
        )}
        <ChatComposer
          value={draft}
          onChange={setDraft}
          bookName={selectedBook.filename}
          busy={busy}
          onStop={() => {
            stop();
          }}
          onSend={() => {
            if (selectedBook.active_index_id && !busy && draft.trim()) {
              sendMessage({ text: draft.trim() });
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
    </div>
  );
}
