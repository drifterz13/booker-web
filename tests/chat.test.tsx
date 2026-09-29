import { screen, waitFor, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { uploadedBook } from "./mocks/fixtures";
import { renderChatPage } from "./render-chat-page";

it("lets the reader choose a saved book from the list and shows its PDF preview", async () => {
  const { user } = renderChatPage();
  const selector = screen.getByRole("combobox", { name: "Book to chat with" });

  expect(screen.queryByRole("region", { name: "PDF preview" })).not.toBeInTheDocument();
  await waitFor(() => expect(selector).toBeEnabled());
  await user.click(selector);
  await user.click(await screen.findByRole("option", { name: uploadedBook.filename }));

  expect(screen.getByRole("combobox", { name: "Book to chat with" })).toHaveTextContent(
    uploadedBook.filename,
  );
  const preview = within(await screen.findByRole("region", { name: "PDF preview" }));

  expect(preview.getByRole("heading", { name: uploadedBook.filename })).toBeVisible();
  expect(await preview.findByText("1 / 1")).toBeVisible();
  expect(preview.getByRole("link", { name: "Download PDF" })).toHaveAttribute(
    "download",
    uploadedBook.filename,
  );
  expect(preview.queryByRole("alert")).not.toBeInTheDocument();
});
