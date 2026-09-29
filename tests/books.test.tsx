import { screen, within } from "@testing-library/react";
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
    expect(card.getByText("Uploaded")).toBeVisible();
    expect(card.getByText(/PDF · Added/)).toBeVisible();
  });

  it("lists a successfully uploaded book without a thumbnail", async () => {
    renderBooksPage();

    const title = await screen.findByRole("heading", {
      name: bookWithoutThumbnail.filename,
    });
    const card = within(title.closest("article")!);

    expect(title).toBeVisible();
    expect(card.queryByRole("img")).not.toBeInTheDocument();
    expect(card.getByText("Uploaded")).toBeVisible();
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
  });

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
});

describe("Add a book", () => {
  it.each([
    ["a small PDF", 32],
    ["a PDF spanning multiple storage parts", 9 * 1024 * 1024],
  ])("uploads %s and lists the newly created book", async (_description, size) => {
    library.length = 0;
    const { user } = renderBooksPage();

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
      new File([new Uint8Array(size)], "My new book.pdf", {
        type: "application/pdf",
      }),
    );

    expect(await screen.findByText("Book added. Processing has started.")).toBeVisible();
    const title = await screen.findByRole("heading", {
      name: "My new book.pdf",
    });
    const card = within(title.closest("article")!);

    expect(card.getByText("Uploading")).toBeVisible();
    expect(card.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add a book" })).toBeEnabled();
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

    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    expect(screen.getByRole("button", { name: "Add a book" })).toBeEnabled();
    expect(screen.queryByText("Book added. Processing has started.")).not.toBeInTheDocument();
  });
});
