import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, expect, it, vi } from "vitest";
import { BookUploadProvider } from "./upload-context";
import { BookUpload } from "./components/book-upload";
import { createBook } from "./api/books";
import { abortUpload, completeUpload, startUpload } from "./api/uploads";
import { uploadParts } from "./lib/multipart-upload";
import { bookKeys } from "./queries";

vi.mock("./api/books", () => ({ createBook: vi.fn() }));
vi.mock("./api/uploads", () => ({
  startUpload: vi.fn(),
  completeUpload: vi.fn(),
  abortUpload: vi.fn(),
}));
vi.mock("./lib/multipart-upload", () => ({ uploadParts: vi.fn() }));
const upload = { upload_id: "upload-id", object_key: "books/book.pdf" };
const book = {
  id: "book-id",
  filename: "book.pdf",
  status: "uploaded",
  created_at: "2026-09-29",
  ingestion: { status: "building" },
};
const parts = [{ part_number: 1, etag: '"etag"' }];
const file = () => new File(["%PDF-1.4"], "book.pdf", { type: "application/pdf" });

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(startUpload).mockResolvedValue(upload);
  vi.mocked(completeUpload).mockResolvedValue({ object_key: upload.object_key, etag: "etag" });
  vi.mocked(createBook).mockResolvedValue(book as Awaited<ReturnType<typeof createBook>>);
  vi.mocked(abortUpload).mockResolvedValue(undefined);
  vi.mocked(uploadParts).mockResolvedValue(parts);
});

function setup() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const invalidate = vi.spyOn(client, "invalidateQueries");

  render(
    <QueryClientProvider client={client}>
      <BookUploadProvider>
        <BookUpload />
      </BookUploadProvider>
    </QueryClientProvider>,
  );

  return { user: userEvent.setup(), client, invalidate };
}

it("completes the upload before creating the book and refreshes cached lists", async () => {
  const { user, client, invalidate } = setup();

  await user.upload(screen.getByLabelText("Choose a PDF book"), file());
  await screen.findByText("Book added. Processing has started.");
  expect(completeUpload).toHaveBeenCalledWith(upload, parts);
  expect(createBook).toHaveBeenCalledWith("book.pdf", upload.object_key);
  expect(vi.mocked(completeUpload).mock.invocationCallOrder[0]).toBeLessThan(
    vi.mocked(createBook).mock.invocationCallOrder[0],
  );
  expect(client.getQueryData(bookKeys.detail(book.id))).toEqual(book);
  expect(invalidate).toHaveBeenCalledWith({ queryKey: bookKeys.lists });
});

it("shows byte progress and aborts storage when cancelled", async () => {
  vi.mocked(uploadParts).mockImplementation(async (_file, _upload, { signal, onProgress }) => {
    onProgress(4);

    return new Promise((_resolve, reject) =>
      signal.addEventListener("abort", () => reject(new DOMException("Cancelled", "AbortError"))),
    );
  });
  const { user } = setup();

  await user.upload(screen.getByLabelText("Choose a PDF book"), file());
  expect((await screen.findByRole("progressbar")).getAttribute("value")).toBe("50");
  await user.click(screen.getByRole("button", { name: "Cancel upload" }));
  await screen.findByText("Upload cancelled.");
  expect(abortUpload).toHaveBeenCalledWith(upload);
  expect(completeUpload).not.toHaveBeenCalled();
  expect(createBook).not.toHaveBeenCalled();
});

it("cleans up an upload ID received after cancellation during preparation", async () => {
  let resolve!: (value: typeof upload) => void;

  vi.mocked(startUpload).mockReturnValue(
    new Promise((done) => {
      resolve = done;
    }),
  );
  const { user } = setup();

  await user.upload(screen.getByLabelText("Choose a PDF book"), file());
  await user.click(screen.getByRole("button", { name: "Cancel upload" }));
  resolve(upload);
  await screen.findByText("Upload cancelled.");
  expect(abortUpload).toHaveBeenCalledWith(upload);
  expect(uploadParts).not.toHaveBeenCalled();
});

it("preserves the object key so failed creation can be retried without reuploading", async () => {
  vi.mocked(createBook).mockRejectedValueOnce(new Error("Service unavailable"));
  const { user } = setup();

  await user.upload(screen.getByLabelText("Choose a PDF book"), file());
  expect((await screen.findByRole("alert")).textContent).toContain("The PDF is uploaded");
  await user.click(screen.getByRole("button", { name: "Retry creating book" }));
  await screen.findByText("Book added. Processing has started.");
  expect(startUpload).toHaveBeenCalledTimes(1);
  expect(uploadParts).toHaveBeenCalledTimes(1);
  expect(createBook).toHaveBeenCalledTimes(2);
  expect(abortUpload).not.toHaveBeenCalled();
});

it("reports failed cleanup and never creates a book after a part fails", async () => {
  vi.mocked(uploadParts).mockRejectedValue(new Error("Part failed"));
  vi.mocked(abortUpload).mockRejectedValue(new Error("Storage down"));
  const { user } = setup();

  await user.upload(screen.getByLabelText("Choose a PDF book"), file());
  expect((await screen.findByRole("alert")).textContent).toContain("could not be cleaned up");
  expect(createBook).not.toHaveBeenCalled();
});

it("rejects invalid files before making any requests", async () => {
  setup();
  const user = userEvent.setup({ applyAccept: false });

  await user.upload(screen.getByLabelText("Choose a PDF book"), new File(["text"], "book.txt"));
  await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("PDF"));
  expect(startUpload).not.toHaveBeenCalled();
});
