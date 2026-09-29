import { useRef } from "react";
import { Upload } from "lucide-react";
import { Button } from "~/shared/components/ui/button";
import { useBookUpload } from "../upload-context";

const labels = {
  idle: "",
  preparing: "Preparing upload…",
  uploading: "Uploading",
  finalizing: "Finalizing upload…",
  creating: "Adding book…",
  success: "Book added. Processing has started.",
  cancelled: "Upload cancelled.",
  error: "",
};

export function BookUpload() {
  const input = useRef<HTMLInputElement>(null);
  const upload = useBookUpload();

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
          <Upload className="size-4" /> Add a book
        </Button>
        {(upload.phase === "preparing" || upload.phase === "uploading") && (
          <Button variant="outline" onClick={upload.cancel}>
            Cancel upload
          </Button>
        )}
        {upload.canRetryCreate && (
          <Button variant="outline" onClick={upload.retryCreate}>
            Retry creating book
          </Button>
        )}
      </div>
      {upload.busy && (
        <p className="mt-3 truncate text-xs text-muted-foreground" title={upload.filename}>
          {upload.filename}
        </p>
      )}
      {upload.phase === "uploading" && (
        <progress
          aria-label="PDF upload progress"
          className="mt-2 h-2 w-full accent-primary"
          max={100}
          value={upload.progress}
        />
      )}
      {labels[upload.phase] && (
        <output className="mt-2 text-sm text-muted-foreground">
          {labels[upload.phase]}
          {upload.phase === "uploading" ? ` ${upload.progress}%` : ""}
        </output>
      )}
      {upload.error && upload.phase === "error" && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {upload.error}
        </p>
      )}
    </div>
  );
}
