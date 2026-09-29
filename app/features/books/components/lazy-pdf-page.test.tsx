import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { LazyPdfPage } from "./lazy-pdf-page";

vi.mock("react-pdf", () => ({
  Page: ({ onRenderSuccess }: { onRenderSuccess: () => void }) => (
    <button onClick={onRenderSuccess}>Finish rendering</button>
  ),
}));
afterEach(() => vi.unstubAllGlobals());

it("waits until the page is near the viewport and keeps its frame fixed while the canvas renders", async () => {
  let notifyIntersection: (entries: { isIntersecting: boolean }[]) => void = () => {};

  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: typeof notifyIntersection) {
        notifyIntersection = callback;
      }
      observe() {}
      disconnect() {}
    },
  );
  const document = {
    getPage: async () => ({ getViewport: () => ({ width: 600, height: 800 }) }),
  } as unknown as PDFDocumentProxy;

  render(
    <LazyPdfPage document={document} pageNumber={1} width={450} scrollRoot={{ current: null }} />,
  );
  const frame = screen.getByLabelText("PDF page 1");

  await waitFor(() => expect(parseFloat(frame.style.aspectRatio)).toBe(0.75));
  expect(frame.style.width).toBe("450px");
  expect(screen.queryByRole("button", { name: "Finish rendering" })).toBeNull();
  act(() => notifyIntersection([{ isIntersecting: true }]));
  expect(screen.getByText("Loading page…")).toBeTruthy();
  await userEvent.setup().click(screen.getByRole("button", { name: "Finish rendering" }));
  expect(screen.queryByText("Loading page…")).toBeNull();
  expect(frame.style.width).toBe("450px");
  expect(parseFloat(frame.style.aspectRatio)).toBe(0.75);
});
