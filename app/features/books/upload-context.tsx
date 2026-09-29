import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createBook } from "./api/books";
import { abortUpload, completeUpload, startUpload } from "./api/uploads";
import { uploadParts } from "./lib/multipart-upload";
import { validateBook } from "./lib/validate-book";
import { bookKeys } from "./queries";
import type { Upload } from "./api/types";

type Phase =
  | "idle"
  | "preparing"
  | "uploading"
  | "finalizing"
  | "creating"
  | "success"
  | "cancelled"
  | "error";

interface UploadState {
  phase: Phase;
  filename?: string;
  progress: number;
  error?: string;
  canRetryCreate?: boolean;
}

interface UploadContextValue extends UploadState {
  busy: boolean;
  start: (file: File) => void;
  cancel: () => void;
  retryCreate: () => void;
}

const UploadContext = createContext<UploadContextValue | null>(null);

export function BookUploadProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<UploadState>({ phase: "idle", progress: 0 });
  const controller = useRef<AbortController | null>(null);
  const running = useRef(false);
  const completed = useRef<{ filename: string; objectKey: string } | null>(null);
  const mutation = useMutation({
    mutationFn: ({ filename, objectKey }: { filename: string; objectKey: string }) =>
      createBook(filename, objectKey),
    onSuccess: (book) => {
      queryClient.setQueryData(bookKeys.detail(book.id), book);
      void queryClient.invalidateQueries({ queryKey: bookKeys.lists });
    },
  });

  async function registerBook() {
    const uploaded = completed.current;

    if (!uploaded) return;

    setState({ phase: "creating", filename: uploaded.filename, progress: 100 });

    try {
      await mutation.mutateAsync(uploaded);
      completed.current = null;
      setState({ phase: "success", filename: uploaded.filename, progress: 100 });
    } catch (error) {
      setState({
        phase: "error",
        filename: uploaded.filename,
        progress: 100,
        canRetryCreate: true,
        error: `${error instanceof Error ? error.message : "Could not create the book."} The PDF is uploaded. Check the library before retrying; the request may have succeeded.`,
      });
      void queryClient.invalidateQueries({ queryKey: bookKeys.lists });
    }
  }

  async function run(file: File) {
    const control = new AbortController();

    controller.current = control;
    let upload: Upload | undefined;
    let finished = false;

    setState({ phase: "preparing", filename: file.name, progress: 0 });

    try {
      // Receive the upload ID even if cancelled during preparation, so it can be cleaned up.
      upload = await startUpload(file.name);
      control.signal.throwIfAborted();
      setState({ phase: "uploading", filename: file.name, progress: 0 });
      const parts = await uploadParts(file, upload, {
        signal: control.signal,
        onProgress: (bytes) =>
          setState({
            phase: "uploading",
            filename: file.name,
            progress: Math.floor((bytes / file.size) * 100),
          }),
      });

      control.signal.throwIfAborted();
      setState({ phase: "finalizing", filename: file.name, progress: 100 });
      const result = await completeUpload(upload, parts);

      finished = true;
      completed.current = { filename: file.name, objectKey: result.object_key };
      await registerBook();
    } catch (error) {
      let cleanupError = "";

      if (upload && !finished) {
        try {
          await abortUpload(upload);
        } catch {
          cleanupError = " The unfinished storage upload could not be cleaned up.";
        }
      }

      setState({
        phase: control.signal.aborted && !cleanupError ? "cancelled" : "error",
        filename: file.name,
        progress: 0,
        error:
          (control.signal.aborted
            ? "Upload cancelled."
            : error instanceof Error
              ? error.message
              : "Could not upload the PDF.") + cleanupError,
      });
    } finally {
      running.current = false;
      controller.current = null;
    }
  }

  function start(file: File) {
    if (running.current) return;

    const error = validateBook(file);

    if (error) {
      setState({ phase: "error", progress: 0, error });

      return;
    }

    completed.current = null;
    running.current = true;
    void run(file);
  }

  function retryCreate() {
    if (running.current || !completed.current) return;

    running.current = true;
    void registerBook().finally(() => {
      running.current = false;
    });
  }

  const busy = ["preparing", "uploading", "finalizing", "creating"].includes(state.phase);

  return (
    <UploadContext.Provider
      value={{
        ...state,
        busy,
        start,
        retryCreate,
        cancel: () => {
          if (state.phase === "preparing" || state.phase === "uploading")
            controller.current?.abort();
        },
      }}
    >
      {children}
    </UploadContext.Provider>
  );
}
export function useBookUpload() {
  const value = useContext(UploadContext);

  if (!value) throw new Error("useBookUpload must be used within BookUploadProvider");

  return value;
}
