import { signParts } from "../api/uploads";
import type { CompletedPart, Upload } from "../api/types";

export const PART_SIZE = 8 * 1024 * 1024;
const CONCURRENCY = 3;

export class PartUploadError extends Error {
  constructor(
    message: string,
    public retryable: boolean,
  ) {
    super(message);
  }
}

export function putPart(
  url: string,
  bytes: Blob,
  signal: AbortSignal,
  onProgress: (bytes: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    signal.throwIfAborted();
    const xhr = new XMLHttpRequest();
    const cleanup = () => signal.removeEventListener("abort", abort);
    const abort = () => xhr.abort();

    xhr.upload.addEventListener("progress", (event) => onProgress(event.loaded));
    xhr.addEventListener("load", () => {
      cleanup();

      if (xhr.status < 200 || xhr.status >= 300) {
        reject(
          new PartUploadError(
            `A PDF part could not be uploaded (${xhr.status}).`,
            xhr.status === 403 || xhr.status === 408 || xhr.status === 429 || xhr.status >= 500,
          ),
        );

        return;
      }

      const etag = xhr.getResponseHeader("ETag");

      if (!etag) {
        reject(
          new PartUploadError("Storage did not return an ETag. Check its CORS settings.", false),
        );

        return;
      }

      onProgress(bytes.size);
      resolve(etag);
    });
    xhr.addEventListener("error", () => {
      cleanup();
      reject(
        new PartUploadError(
          "Could not reach upload storage. Check your connection and storage CORS settings.",
          true,
        ),
      );
    });
    xhr.addEventListener("timeout", () => {
      cleanup();
      reject(new PartUploadError("Uploading a PDF part timed out.", true));
    });
    xhr.addEventListener("abort", () => {
      cleanup();
      reject(new DOMException("Upload cancelled", "AbortError"));
    });
    xhr.open("PUT", url);
    xhr.timeout = 120_000;
    signal.addEventListener("abort", abort, { once: true });
    xhr.send(bytes);
  });
}

interface UploadOptions {
  signal: AbortSignal;
  onProgress?: (bytes: number) => void;
  sendPart?: typeof putPart;
  getUrls?: typeof signParts;
}

export async function uploadParts(
  file: File,
  upload: Upload,
  { signal, onProgress, sendPart = putPart, getUrls = signParts }: UploadOptions,
): Promise<CompletedPart[]> {
  const count = Math.ceil(file.size / PART_SIZE);
  const controller = new AbortController();
  const abort = () => controller.abort(signal.reason);

  signal.addEventListener("abort", abort, { once: true });

  if (signal.aborted) abort();

  const loaded = Array<number>(count).fill(0);
  const parts = Array<CompletedPart>(count);
  let next = 0;

  async function worker() {
    while (next < count) {
      controller.signal.throwIfAborted();
      const index = next++;
      const partNumber = index + 1;
      const bytes = file.slice(index * PART_SIZE, (index + 1) * PART_SIZE);

      for (let attempt = 0; ; attempt++) {
        controller.signal.throwIfAborted();

        try {
          // Sign just before each attempt so queued parts and retries have fresh URLs.
          const urls = await getUrls(upload, [partNumber], controller.signal);
          const url = urls.find((part) => part.part_number === partNumber)?.url;

          if (!url) throw new Error("The API did not return the requested part URL.");

          const etag = await sendPart(url, bytes, controller.signal, (value) => {
            loaded[index] = Math.min(bytes.size, value);
            onProgress?.(loaded.reduce((sum, size) => sum + size, 0));
          });

          parts[index] = { part_number: partNumber, etag };
          break;
        } catch (error) {
          if (
            controller.signal.aborted ||
            !(error instanceof PartUploadError) ||
            !error.retryable ||
            attempt >= 2
          )
            throw error;

          loaded[index] = 0;
          onProgress?.(loaded.reduce((sum, size) => sum + size, 0));
        }
      }
    }
  }

  const workers = Array.from({ length: Math.min(CONCURRENCY, count) }, () => worker());

  try {
    await Promise.all(workers);

    return parts;
  } catch (error) {
    controller.abort();
    await Promise.allSettled(workers);

    throw error;
  } finally {
    signal.removeEventListener("abort", abort);
  }
}
