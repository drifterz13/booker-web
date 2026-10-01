import { ArrowUp, Square } from "lucide-react";
import { useId, useRef } from "react";
import { Button } from "~/shared/components/ui/button";
import { Textarea } from "~/shared/components/ui/textarea";

interface ChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  bookName?: string;
  waitingForBook?: boolean;
  busy?: boolean;
  onStop?: () => void;
}

export function ChatComposer({
  value,
  onChange,
  onSend,
  bookName,
  waitingForBook = false,
  busy = false,
  onStop,
}: ChatComposerProps) {
  const hintId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canSend = Boolean(value.trim() && bookName && !busy);

  function submit() {
    if (!canSend) return;

    onSend();
    textareaRef.current?.focus();
  }

  return (
    <div className="chat-composer">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        className="flex items-end gap-3 rounded-2xl border bg-background p-3 shadow-surface transition-shadow focus-within:border-primary/40 focus-within:ring-3 focus-within:ring-ring/5 sm:px-4"
      >
        <Textarea
          ref={textareaRef}
          value={value}
          maxLength={20_000}
          onChange={(event) => onChange(event.target.value)}
          aria-label="Your question"
          aria-describedby={hintId}
          placeholder="What would you like to know about your book?"
          className="min-h-9 max-h-40 min-w-0 flex-1 resize-none border-0 px-0 py-1 text-base leading-6 shadow-none focus-visible:ring-0 md:text-base"
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              submit();
            }
          }}
        />
        {busy ? (
          <Button
            type="button"
            size="icon"
            aria-label="Stop response"
            onClick={onStop}
            className="size-9 shrink-0 rounded-lg"
          >
            <Square className="size-4" />
          </Button>
        ) : (
          <Button
            type="submit"
            size="icon"
            disabled={!canSend}
            aria-label="Send message"
            className="size-9 shrink-0 rounded-lg"
          >
            <ArrowUp className="size-4" />
          </Button>
        )}
      </form>
      <p
        id={hintId}
        className={bookName ? "sr-only" : "mt-2 text-center text-caption text-muted-foreground"}
      >
        {bookName
          ? "Enter to send · Shift + Enter for a new line"
          : waitingForBook
            ? "Processing books will be available here automatically."
            : "Choose a PDF book to start a conversation."}
      </p>
    </div>
  );
}
