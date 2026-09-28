import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "~/shared/components/ui/button";
import { useBooks } from "../books-context";

export function BookUploadButton({
  variant = "default",
  onAdded,
}: {
  variant?: "default" | "outline";
  onAdded?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const { addBook } = useBooks();

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        aria-label="Choose a PDF book"
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            const validationError = addBook(file);
            setError(validationError);
            if (!validationError) onAdded?.();
          }
          event.target.value = "";
        }}
      />
      <Button
        type="button"
        variant={variant}
        className="rounded-lg"
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="size-4" /> Add a book
      </Button>
      {error && (
        <p role="alert" className="mt-2 max-w-64 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
