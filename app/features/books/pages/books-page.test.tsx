import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, expect, it, vi } from "vitest";
import { BooksPage } from "./books-page";
import { BookUploadProvider } from "../upload-context";

afterEach(() => vi.unstubAllGlobals());

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  render(
    <QueryClientProvider client={client}>
      <BookUploadProvider>
        <BooksPage />
      </BookUploadProvider>
    </QueryClientProvider>,
  );

  return userEvent.setup();
}

const book = {
  id: "book-id",
  filename: "Saved book.pdf",
  status: "uploaded",
  created_at: "2026-09-29T00:00:00Z",
  thumbnail_url: null,
};

it("loads server books with thumbnails, upload status, and offset pagination", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify(
          Array.from({ length: 20 }, (_, index) => ({
            ...book,
            id: `id-${index}`,
            filename: `Book ${index}.pdf`,
            thumbnail_url: index === 0 ? "https://storage/thumbnail.png" : null,
          })),
        ),
      ),
    )
    .mockResolvedValueOnce(new Response(JSON.stringify([book])));

  vi.stubGlobal("fetch", fetch);
  const user = setup();

  await screen.findByText("Book 0.pdf");
  expect(screen.getAllByText("Uploaded")).toHaveLength(20);
  const cover = screen.getByAltText("Cover of Book 0.pdf");

  fireEvent.error(cover);
  expect(screen.queryByAltText("Cover of Book 0.pdf")).toBeNull();
  expect(fetch.mock.calls[0][0]).toContain("/books?offset=0&limit=20");
  await user.click(screen.getByRole("button", { name: "Next" }));
  await screen.findByText("Saved book.pdf");
  expect(fetch.mock.calls[1][0]).toContain("/books?offset=20&limit=20");
  expect((screen.getByRole("button", { name: "Next" }) as HTMLButtonElement).disabled).toBe(true);
});

it("distinguishes loading from an empty library", async () => {
  let resolve!: (value: Response) => void;

  vi.stubGlobal(
    "fetch",
    vi.fn(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    ),
  );
  setup();
  expect(screen.getByText("Loading your books…")).toBeTruthy();
  expect(screen.queryByText("Your next read starts here")).toBeNull();
  resolve(new Response("[]"));
  await screen.findByText("Your next read starts here");
});

it("shows API errors and retries without displaying an empty library", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: "Could not list books" }), { status: 503 }),
    )
    .mockResolvedValueOnce(new Response(JSON.stringify([book])));

  vi.stubGlobal("fetch", fetch);
  const user = setup();

  await screen.findByText("Could not list books");
  expect(screen.queryByText("Your next read starts here")).toBeNull();
  await user.click(screen.getByRole("button", { name: "Retry loading books" }));
  await waitFor(() => expect(screen.getByText("Saved book.pdf")).toBeTruthy());
});
