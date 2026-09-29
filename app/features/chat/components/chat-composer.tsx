import { ArrowUp, BookOpen } from "lucide-react";
import { useId, useRef } from "react";
import { Button } from "~/shared/components/ui/button";
import { Textarea } from "~/shared/components/ui/textarea";

interface ChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  bookName?: string;
}

export function ChatComposer({ value, onChange, onSend, bookName }: ChatComposerProps) {
  const hintId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canSend = Boolean(value.trim() && bookName);

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
        className="rounded-2xl border bg-white p-4 shadow-[0_2px_12px_-5px_#00000012] transition-shadow focus-within:border-primary/40 focus-within:shadow-[0_0_0_3px_#3d56490b] sm:p-5"
      >
        <Textarea
          ref={textareaRef}
          value={value}
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
          <Button
            type="submit"
            size="icon"
            disabled={!canSend}
            aria-label="Send message"
            className="size-9 rounded-lg"
          >
            <ArrowUp className="size-4" />
          </Button>
        </div>
      </form>
      <p id={hintId} className="mt-3 text-center text-[11px] leading-5 text-muted-foreground">
        {bookName
          ? "Enter to send · Shift + Enter for a new line"
          : "Choose a PDF book to start a conversation."}
      </p>
    </div>
  );
}
