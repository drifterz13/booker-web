import { useRef } from "react";
import { Upload } from "lucide-react";
import { Button } from "~/shared/components/ui/button";
import { BookMotion } from "~/shared/components/book-motion";
import { useBookUpload } from "../upload-context";

export function BookUpload() {
  const input = useRef<HTMLInputElement>(null);
  const upload = useBookUpload();
  const buttonLabel = upload.busy
    ? `Uploading…${upload.phase === "uploading" ? ` ${upload.progress}%` : ""}`
    : "Add a book";

  return (
    <div className="w-full max-w-sm">
      <input
        ref={input}
        type="file"
        accept="application/pdf,.pdf"
        aria-label="Choose a PDF book"
        className="sr-only"
        tabIndex={-1}
        disabled={upload.busy}
        onChange={(event) => {
          const file = event.target.files?.[0];

          if (file) upload.start(file);

          event.target.value = "";
        }}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={upload.busy}
          onClick={() => input.current?.click()}
          className="rounded-lg"
        >
          {upload.busy ? (
            <BookMotion loading className="text-current" />
          ) : (
            <Upload className="size-4" aria-hidden="true" />
          )}
          {buttonLabel}
        </Button>
      </div>
    </div>
  );
}
