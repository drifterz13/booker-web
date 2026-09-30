import { ArrowUp, BookOpen, Square } from "lucide-react";
import { useId, useRef } from "react";
import { Button } from "~/shared/components/ui/button";
import { Textarea } from "~/shared/components/ui/textarea";

interface ChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  bookName?: string;
  busy?: boolean;
  ready?: boolean;
  onStop?: () => void;
}

export function ChatComposer({
  value,
  onChange,
  onSend,
  bookName,
  busy = false,
  ready = true,
  onStop,
}: ChatComposerProps) {
  const hintId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canSend = Boolean(value.trim() && bookName && ready && !busy);

  function submit() {
    if (!canSend) return;

    onSend();
    textareaRef.current?.focus();
  }

  return (
    <div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        className="rounded-2xl border bg-background p-4 shadow-surface transition-shadow focus-within:border-primary/40 focus-within:ring-3 focus-within:ring-ring/5 sm:p-5"
      >
        <Textarea
          ref={textareaRef}
          value={value}
          maxLength={20_000}
          onChange={(event) => onChange(event.target.value)}
          aria-label="Your question"
          aria-describedby={hintId}
          placeholder="What would you like to know about your book?"
          className="min-h-24 max-h-64 resize-none border-0 p-0 text-base shadow-none focus-visible:ring-0 md:text-base"
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              submit();
            }
          }}
        />
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
            <BookOpen className="size-3.5 shrink-0" />
            <span className="truncate">{bookName ?? "Add a book to get started"}</span>
          </span>
          {busy ? (
            <Button
              type="button"
              size="icon"
              aria-label="Stop response"
              onClick={onStop}
              className="size-9 rounded-lg"
            >
              <Square className="size-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              disabled={!canSend}
              aria-label="Send message"
              className="size-9 rounded-lg"
            >
              <ArrowUp className="size-4" />
            </Button>
          )}
        </div>
      </form>
      <p id={hintId} className="mt-3 text-center text-caption text-muted-foreground">
        {bookName && !ready
          ? "This book is not ready for chat yet."
          : bookName
            ? "Enter to send · Shift + Enter for a new line"
            : "Choose a PDF book to start a conversation."}
      </p>
    </div>
  );
}
