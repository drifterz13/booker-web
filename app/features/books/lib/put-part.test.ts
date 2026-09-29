import { afterEach, expect, it, vi } from "vitest";
import { putPart } from "./multipart-upload";

class FakeRequest extends EventTarget {
  static last: FakeRequest;
  upload = new EventTarget();
  status = 200;
  timeout = 0;
  etag: string | null = '"storage-etag"';
  open = vi.fn();
  send = vi.fn();
  abort = vi.fn(() => this.dispatchEvent(new Event("abort")));
  getResponseHeader = vi.fn(() => this.etag);
  constructor() {
    super();
    FakeRequest.last = this;
  }
}

afterEach(() => vi.unstubAllGlobals());

it("sends raw part bytes, reports progress, and preserves the quoted ETag", async () => {
  vi.stubGlobal("XMLHttpRequest", FakeRequest);
  const bytes = new Blob(["pdf"]);
  const progress = vi.fn();
  const result = putPart("https://storage/part", bytes, new AbortController().signal, progress);
  const request = FakeRequest.last;

  expect(request.open).toHaveBeenCalledWith("PUT", "https://storage/part");
  expect(request.send).toHaveBeenCalledWith(bytes);
  request.upload.dispatchEvent(new ProgressEvent("progress", { loaded: 2 }));
  expect(progress).toHaveBeenCalledWith(2);
  request.dispatchEvent(new Event("load"));
  await expect(result).resolves.toBe('"storage-etag"');
  expect(progress).toHaveBeenLastCalledWith(3);
});

it("rejects a successful response when storage does not expose ETag", async () => {
  vi.stubGlobal("XMLHttpRequest", FakeRequest);
  const result = putPart(
    "https://storage/part",
    new Blob(["pdf"]),
    new AbortController().signal,
    vi.fn(),
  );

  FakeRequest.last.etag = null;
  FakeRequest.last.dispatchEvent(new Event("load"));
  await expect(result).rejects.toMatchObject({
    retryable: false,
    message: expect.stringContaining("ETag"),
  });
});

it("aborts the active request and removes its cancellation listener after completion", async () => {
  vi.stubGlobal("XMLHttpRequest", FakeRequest);
  const control = new AbortController();
  const result = putPart("https://storage/part", new Blob(["pdf"]), control.signal, vi.fn());

  control.abort();
  await expect(result).rejects.toMatchObject({ name: "AbortError" });
  expect(FakeRequest.last.abort).toHaveBeenCalledTimes(1);
  const finished = new AbortController();
  const next = putPart("https://storage/part", new Blob(["pdf"]), finished.signal, vi.fn());

  FakeRequest.last.dispatchEvent(new Event("load"));
  await next;
  finished.abort();
  expect(FakeRequest.last.abort).not.toHaveBeenCalled();
});
