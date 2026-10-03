import { screen, waitFor, within } from "@testing-library/react";
import { delay, http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { bookWithoutThumbnail, makeBook, uploadedBook } from "./mocks/fixtures";
import { apiUrl } from "./mocks/handlers/books";
import { server } from "./mocks/server";
import { library } from "./mocks/state";
import { renderBooksPage } from "./render-books-page";

function listBooks(books: ReturnType<typeof makeBook>[]) {
  server.use(http.get(`${apiUrl}/books`, () => HttpResponse.json(books)));
}

describe("My books", () => {
  it("lists a successfully uploaded book with its thumbnail", async () => {
    renderBooksPage();

    const title = await screen.findByRole("heading", {
      name: uploadedBook.filename,
    });
    const card = within(title.closest("article")!);

    expect(card.getByRole("img", { name: `Cover of ${uploadedBook.filename}` })).toHaveAttribute(
      "src",
      uploadedBook.thumbnail_url,
    );
    expect(card.getByText("Ready to chat")).toBeVisible();
    expect(card.getByText(/PDF · Added/)).toBeVisible();
  });

  it("starts a fresh chat with the book chosen from the library", async () => {
    const { user } = renderBooksPage();
    const title = await screen.findByRole("heading", { name: uploadedBook.filename });
    const card = within(title.closest("article")!);

    await user.click(card.getByRole("link", { name: `Start chat with ${uploadedBook.filename}` }));

    expect(await screen.findByRole("textbox", { name: "Your question" })).toBeVisible();
    expect(screen.getByRole("combobox", { name: "Book to chat with" })).toHaveTextContent(
      uploadedBook.filename,
    );
  });

  it("lists a successfully uploaded book without a thumbnail", async () => {
    renderBooksPage();

    const title = await screen.findByRole("heading", {
      name: bookWithoutThumbnail.filename,
    });
    const card = within(title.closest("article")!);

    expect(title).toBeVisible();
    expect(card.queryByRole("img")).not.toBeInTheDocument();
    expect(card.getByText("Ready to chat")).toBeVisible();
    expect(card.getByText(/PDF · Added/)).toBeVisible();
  });

  it.each([
    ["uploading", "Uploading"],
    ["failed", "Upload failed"],
  ] as const)("lists a book whose upload status is %s", async (status, label) => {
    listBooks([makeBook({ status, thumbnail_url: null })]);
    renderBooksPage();

    expect(await screen.findByRole("heading", { name: uploadedBook.filename })).toBeVisible();
    expect(screen.getByText(label)).toBeVisible();
    expect(screen.getByRole("button", { name: "Start chat" })).toBeDisabled();
  });

  it("shows processing for an uploaded book before its chat index is ready", async () => {
    listBooks([makeBook({ active_index_id: null })]);
    renderBooksPage();

    expect(await screen.findByText("Processing")).toBeVisible();
    expect(screen.queryByText("Ready to chat")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start chat" })).toBeDisabled();
  });

  it("refreshes a processing book and stops polling when it is ready", async () => {
    let requests = 0;

    server.use(
      http.get(`${apiUrl}/books`, () => {
        requests += 1;

        return HttpResponse.json([
          makeBook({ active_index_id: requests === 1 ? null : "index-ready", thumbnail_url: null }),
        ]);
      }),
    );
    renderBooksPage();

    expect(await screen.findByText("Processing")).toBeVisible();
    expect(await screen.findByText("Ready to chat", {}, { timeout: 4_000 })).toBeVisible();
    expect(requests).toBe(3);

    await new Promise((resolve) => setTimeout(resolve, 3_200));
    expect(requests).toBe(3);
  }, 8_000);

  it("guides the reader to add a PDF when their library is empty", async () => {
    listBooks([]);
    renderBooksPage();

    expect(
      await screen.findByRole("heading", {
        name: "Your next read starts here",
      }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Add a book" })).toBeEnabled();
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
  });

  it("shows loading feedback while fetching the library", async () => {
    server.use(
      http.get(`${apiUrl}/books`, async () => {
        await delay(100);

        return HttpResponse.json([uploadedBook]);
      }),
    );
    renderBooksPage();

    expect(screen.getByRole("status")).toHaveTextContent("Loading your books…");
    expect(await screen.findByRole("heading", { name: uploadedBook.filename })).toBeVisible();
    expect(screen.queryByText("Loading your books…")).not.toBeInTheDocument();
  });

  it("keeps a library fetch error inline without a retry button", async () => {
    server.use(
      http.get(`${apiUrl}/books`, () =>
        HttpResponse.json({ detail: "Library unavailable" }, { status: 503 }),
      ),
    );
    renderBooksPage();

    expect(await screen.findByRole("alert")).toHaveTextContent("Library unavailable");
    expect(screen.queryByRole("button", { name: /Retry/ })).not.toBeInTheDocument();
  });
});

describe("Add a book", () => {
  it("shows upload progress in the button while the file is being sent", async () => {
    server.use(
      http.post(`${apiUrl}/uploads/:id/parts`, async ({ params }) => {
        await delay(300);

        return HttpResponse.json([
          {
            part_number: 1,
            url: `https://storage.booker.test/uploads/${params.id}/1`,
            expires_in: 900,
          },
        ]);
      }),
    );
    const { user } = renderBooksPage();

    await screen.findByRole("heading", { name: uploadedBook.filename });
    await user.upload(
      screen.getByLabelText("Choose a PDF book"),
      new File(["PDF"], "In progress.pdf", { type: "application/pdf" }),
    );

    expect(await screen.findByRole("button", { name: /^Uploading… \d+%$/ })).toBeDisabled();
    expect(screen.queryByRole("status", { name: /Uploading/ })).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("button", { name: "Add a book" })).toBeEnabled());
    expect(await screen.findByText("In progress.pdf is now processing.")).toBeVisible();
  });

  it.each([
    ["a small PDF", 32],
    ["a PDF spanning multiple storage parts", 9 * 1024 * 1024],
  ])("uploads %s and lists the newly created book", async (_description, size) => {
    library.length = 0;
    const { user } = renderBooksPage();
    const filename = `${_description}.pdf`;

    await screen.findByRole("heading", {
      name: "Your next read starts here",
    });

    const fileInput = screen.getByLabelText("Choose a PDF book");
    let filePickerOpened = false;

    fileInput.addEventListener(
      "click",
      () => {
        filePickerOpened = true;
      },
      { once: true },
    );
    await user.click(screen.getByRole("button", { name: "Add a book" }));
    expect(filePickerOpened).toBe(true);

    await user.upload(
      fileInput,
      new File([new Uint8Array(size)], filename, {
        type: "application/pdf",
      }),
    );

    const title = await screen.findByRole("heading", {
      name: filename,
    });
    const card = within(title.closest("article")!);

    expect(card.getByText("Uploading")).toBeVisible();
    expect(card.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add a book" })).toBeEnabled();
    expect(await screen.findByText(`${filename} is now processing.`)).toBeVisible();
  });

  it.each([
    [
      "a non-PDF file",
      () => new File(["notes"], "notes.txt", { type: "text/plain" }),
      "Please choose a PDF file.",
    ],
    [
      "an empty PDF",
      () => new File([], "empty.pdf", { type: "application/pdf" }),
      "This file is empty. Choose another PDF.",
    ],
    [
      "a PDF over 100 MB",
      () =>
        new File([new Uint8Array(100 * 1024 * 1024 + 1)], "large.pdf", {
          type: "application/pdf",
        }),
      "Your PDF must be 100 MB or smaller.",
    ],
  ] as const)("rejects %s with helpful feedback", async (_description, file, message) => {
    const { user } = renderBooksPage();

    await screen.findByRole("heading", { name: uploadedBook.filename });

    await user.upload(screen.getByLabelText("Choose a PDF book"), file());

    expect(await screen.findByText(message)).toBeVisible();
    expect(screen.getByLabelText("Choose a PDF book").parentElement).not.toHaveTextContent(message);
    expect(screen.getByRole("button", { name: "Add a book" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: /Retry/ })).not.toBeInTheDocument();
  });

  it("shows an upload failure in a toast without inline error or retry", async () => {
    server.use(
      http.post(`${apiUrl}/uploads`, () =>
        HttpResponse.json({ detail: "Upload storage unavailable" }, { status: 503 }),
      ),
    );
    const { user } = renderBooksPage();

    await screen.findByRole("heading", { name: uploadedBook.filename });
    await user.upload(
      screen.getByLabelText("Choose a PDF book"),
      new File(["PDF"], "Failed upload.pdf", { type: "application/pdf" }),
    );

    expect(await screen.findByText("Upload storage unavailable")).toBeVisible();
    expect(screen.getByLabelText("Choose a PDF book").parentElement).not.toHaveTextContent(
      "Upload storage unavailable",
    );
    expect(screen.queryByRole("button", { name: /Retry/ })).not.toBeInTheDocument();
  });
});
