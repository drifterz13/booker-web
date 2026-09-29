import { describe, expect, it, vi } from "vitest";
import { PART_SIZE, PartUploadError, uploadParts } from "./multipart-upload";

const upload = { upload_id: "upload-id", object_key: "books/book.pdf" };
const getUrls = vi.fn(async (_upload, numbers: number[]) =>
  numbers.map((part_number) => ({ part_number, url: `https://storage/${part_number}` })),
);

describe("multipart upload", () => {
  it("uses three concurrent workers, aggregates byte progress, and returns ordered ETags", async () => {
    const file = new File([new Uint8Array(PART_SIZE * 3 + 10)], "book.pdf");
    let active = 0;
    let peak = 0;
    const sizes: number[] = [];
    const progress = vi.fn();
    const sendPart = vi.fn(async (url, bytes, _signal, report) => {
      active++;
      peak = Math.max(peak, active);
      sizes.push(bytes.size);
      report(bytes.size / 2);
      await Promise.resolve();
      report(bytes.size);
      active--;

      return `"etag-${url.split("/").pop()}"`;
    });
    const parts = await uploadParts(file, upload, {
      signal: new AbortController().signal,
      onProgress: progress,
      sendPart,
      getUrls,
    });

    expect(peak).toBe(3);
    expect(sizes).toEqual([PART_SIZE, PART_SIZE, PART_SIZE, 10]);
    expect(parts).toEqual(
      [1, 2, 3, 4].map((part_number) => ({ part_number, etag: `"etag-${part_number}"` })),
    );
    expect(progress).toHaveBeenLastCalledWith(file.size);
    expect(progress.mock.calls.every(([bytes]) => bytes <= file.size)).toBe(true);
  });

  it("retries only a failed part with a fresh URL and resets its progress", async () => {
    const file = new File([new Uint8Array(PART_SIZE + 10)], "book.pdf");
    const attempts = new Map<string, number>();
    const sign = vi.fn(getUrls);
    const progress = vi.fn();
    const sendPart = vi.fn(async (url, bytes, _signal, report) => {
      const attempt = (attempts.get(url) ?? 0) + 1;

      attempts.set(url, attempt);
      report(bytes.size);

      if (url.endsWith("/1") && attempt === 1) throw new PartUploadError("network", true);

      return "etag";
    });

    await uploadParts(file, upload, {
      signal: new AbortController().signal,
      onProgress: progress,
      sendPart,
      getUrls: sign,
    });
    expect(attempts.get("https://storage/1")).toBe(2);
    expect(attempts.get("https://storage/2")).toBe(1);
    expect(sign).toHaveBeenCalledTimes(3);
    expect(progress).toHaveBeenLastCalledWith(file.size);
  });

  it("cancels active PUTs and leaves queued parts unscheduled", async () => {
    const control = new AbortController();
    const file = new File([new Uint8Array(PART_SIZE * 4)], "book.pdf");
    let started = 0;
    const sendPart = vi.fn(
      (_url, _bytes, signal) =>
        new Promise<string>((_resolve, reject) => {
          signal.addEventListener(
            "abort",
            () => reject(new DOMException("Cancelled", "AbortError")),
            { once: true },
          );

          if (++started === 3) control.abort();
        }),
    );

    await expect(
      uploadParts(file, upload, { signal: control.signal, onProgress: vi.fn(), sendPart, getUrls }),
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(sendPart).toHaveBeenCalledTimes(3);
  });

  it("stops after three failed attempts and does not retry missing ETags", async () => {
    const file = new File(["pdf"], "book.pdf");

    for (const retryable of [true, false]) {
      const sendPart = vi.fn().mockRejectedValue(new PartUploadError("failed", retryable));

      await expect(
        uploadParts(file, upload, {
          signal: new AbortController().signal,
          onProgress: vi.fn(),
          sendPart,
          getUrls,
        }),
      ).rejects.toThrow("failed");
      expect(sendPart).toHaveBeenCalledTimes(retryable ? 3 : 1);
    }
  });
});
