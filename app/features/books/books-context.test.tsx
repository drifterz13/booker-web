import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { BooksProvider, useBooks } from "./books-context";
import { BookUploadButton } from "./components/book-upload-button";

function LibraryHarness() {
  const { books, selectedBook } = useBooks();

  return (
    <>
      <BookUploadButton />
      <output>
        {books.length}:{selectedBook?.name}
      </output>
    </>
  );
}

it("adds and selects a PDF while avoiding duplicate selections", async () => {
  const user = userEvent.setup();

  render(
    <BooksProvider>
      <LibraryHarness />
    </BooksProvider>,
  );
  const file = new File(["%PDF-1.4"], "reading.pdf", { type: "application/pdf" });
  const input = screen.getByLabelText("Choose a PDF book");

  await user.upload(input, file);
  expect(screen.getByRole("status").textContent).toBe("1:reading.pdf");
  await user.upload(input, file);
  expect(screen.getByRole("status").textContent).toBe("1:reading.pdf");
});

it("shows validation feedback and leaves the library empty for invalid files", async () => {
  const user = userEvent.setup({ applyAccept: false });

  render(
    <BooksProvider>
      <LibraryHarness />
    </BooksProvider>,
  );
  await user.upload(
    screen.getByLabelText("Choose a PDF book"),
    new File(["text"], "book.txt", { type: "text/plain" }),
  );
  expect(screen.getByRole("alert").textContent).toMatch(/PDF/);
  expect(screen.getByRole("status").textContent).toBe("0:");
});
