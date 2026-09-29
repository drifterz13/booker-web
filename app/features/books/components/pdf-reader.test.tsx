import { useEffect, type ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import PdfReader from "./pdf-reader";

vi.mock("react-pdf", () => {
  const document = {
    numPages: 2,
    getPage: async () => ({ getViewport: () => ({ width: 612, height: 792 }) }),
  };

  return {
    pdfjs: { GlobalWorkerOptions: {} },
    Document: ({
      file,
      children,
      onLoadSuccess,
      onLoadError,
      onPassword,
    }: {
      file: string;
      children: ReactNode;
      onLoadSuccess: (pdf: typeof document) => void;
      onLoadError: () => void;
      onPassword: () => void;
    }) => {
      useEffect(() => {
        if (file === "broken") onLoadError();
        else if (file === "locked") onPassword();
        else onLoadSuccess(document);
      }, [file, onLoadSuccess, onLoadError, onPassword]);

      return <div>{children}</div>;
    },
    Page: ({ pageNumber, width }: { pageNumber: number; width: number }) => (
      <div data-testid="pdf-page" data-width={width}>
        Page {pageNumber}
      </div>
    ),
  };
});

beforeEach(() => {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(private callback: (entries: { isIntersecting: boolean }[]) => void) {}
      observe() {
        this.callback([{ isIntersecting: true }]);
      }
      disconnect() {}
    },
  );
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(private callback: (entries: { contentRect: { width: number } }[]) => void) {}
      observe() {
        this.callback([{ contentRect: { width: 500 } }]);
      }
      disconnect() {}
    },
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it("navigates pages, limits zoom, and fits the page to its available width", async () => {
  const user = userEvent.setup();

  render(<PdfReader url="blob:book" name="book.pdf" />);
  expect(screen.getByText("1 / 2")).toBeTruthy();
  expect((screen.getByLabelText("Previous page") as HTMLButtonElement).disabled).toBe(true);
  await user.click(screen.getByLabelText("Next page"));
  expect(screen.getByText("2 / 2")).toBeTruthy();
  expect((screen.getByLabelText("Next page") as HTMLButtonElement).disabled).toBe(true);
  await user.click(screen.getByLabelText("Zoom in"));
  await waitFor(() =>
    expect(screen.getByTestId("pdf-page").getAttribute("data-width")).toBe("625"),
  );
  await user.click(screen.getByLabelText("Fit page to width"));
  expect(screen.getByTestId("pdf-page").getAttribute("data-width")).toBe("500");
  await user.click(screen.getByLabelText("Zoom out"));
  await user.click(screen.getByLabelText("Zoom out"));
  expect((screen.getByLabelText("Zoom out") as HTMLButtonElement).disabled).toBe(true);
  expect(screen.getByLabelText("Download PDF").getAttribute("download")).toBe("book.pdf");
});

it.each(["broken", "locked"])(
  "shows feedback for %s PDFs without leaving active reader controls",
  async (url) => {
    render(<PdfReader url={url} name="book.pdf" />);
    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
    expect((screen.getByLabelText("Next page") as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByTestId("pdf-page")).toBeNull();
  },
);
