import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, beforeEach, vi } from "vitest";
import { server } from "./mocks/server";
import { resetApiState } from "./mocks/state";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
beforeEach(async () => {
  resetApiState();
  // Node fetch/structuredClone produce host-realm buffers; PDF.js and its in-process
  // worker must share those constructors for binary responses in jsdom.
  const bytes = new TextEncoder().encode("");

  vi.stubGlobal("Uint8Array", bytes.constructor);
  vi.stubGlobal("ArrayBuffer", bytes.buffer.constructor);
  // Run the real PDF.js worker in-process: jsdom has no browser Worker API.
  vi.stubGlobal("pdfjsWorker", await import("pdfjs-dist/legacy/build/pdf.worker.mjs"));
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("min-width"),
    media: query,
    addEventListener() {},
    removeEventListener() {},
  }));
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  Element.prototype.scrollIntoView = () => {};
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
});
afterEach(() => {
  cleanup();
  server.resetHandlers();
  vi.unstubAllGlobals();
});
afterAll(() => server.close());
