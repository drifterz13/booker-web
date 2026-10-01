import { expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "./mocks/server";
import { apiUrl } from "./mocks/handlers/books";
import { uploadedBook } from "./mocks/fixtures";
import { ApiError, readApiError } from "~/shared/api/client";
import { getBookPdf, listBooks } from "~/features/books/api/books";
import { abortUpload, startUpload } from "~/features/books/api/uploads";

it.each([
  { detail: null },
  { detail: ["not a message"] },
  { detail: "   " },
  { message: "different shape" },
  null,
])("uses the fallback for malformed error bodies: %j", async (body) => {
  const response = new Response(JSON.stringify(body), { status: 503 });
  const error = await readApiError(response, "Please try again.");

  expect(error).toBeInstanceOf(ApiError);
  expect(error.status).toBe(503);
  expect(error.message).toBe("Please try again.");
});

it("preserves a validated server error and falls back for non-JSON bodies", async () => {
  const error = await readApiError(
    new Response(JSON.stringify({ detail: "Upload not found", extra: true }), { status: 404 }),
    "Fallback",
  );

  expect(error.message).toBe("Upload not found");
  const invalid = await readApiError(
    new Response("<html>Unavailable</html>", { status: 502 }),
    "Fallback",
  );

  expect(invalid.message).toBe("Fallback");
});

it.each([
  { ...uploadedBook, status: "unexpected" },
  { ...uploadedBook, filename: 42 },
  { ...uploadedBook, active_index_id: {} },
])("rejects malformed books before returning them to the UI: %j", async (book) => {
  server.use(http.get(`${apiUrl}/books`, () => HttpResponse.json([book])));

  await expect(listBooks(0, 20)).rejects.toThrow("The API returned an invalid response.");
});

it("rejects invalid PDF URLs and malformed successful JSON", async () => {
  server.use(http.get(`${apiUrl}/books/:id/pdf`, () => HttpResponse.json({ url: 42 })));

  await expect(getBookPdf(uploadedBook.id)).rejects.toThrow(
    "The API returned an invalid response.",
  );
  server.use(http.get(`${apiUrl}/books/:id/pdf`, () => new HttpResponse("not JSON")));

  await expect(getBookPdf(uploadedBook.id)).rejects.toThrow(
    "The API returned an invalid response.",
  );
});

it("accepts omitted PDF expiry and tolerates extra server fields", async () => {
  const url = "https://storage.booker.test/book.pdf";

  server.use(
    http.get(`${apiUrl}/books/:id/pdf`, () => HttpResponse.json({ url, future_field: true })),
  );

  await expect(getBookPdf(uploadedBook.id)).resolves.toEqual({ url });
});

it("validates upload identifiers and accepts the empty abort response", async () => {
  const upload = await startUpload("book.pdf");

  await expect(abortUpload(upload)).resolves.toBeUndefined();
  server.use(
    http.post(`${apiUrl}/uploads`, () =>
      HttpResponse.json({ upload_id: 12, object_key: "book.pdf" }),
    ),
  );

  await expect(startUpload("book.pdf")).rejects.toThrow("The API returned an invalid response.");
});
