import { http, HttpResponse } from "msw";
import { makeBook } from "../fixtures";
import { library, uploads } from "../state";
import { makePreviewPdf } from "../pdf";

export const apiUrl = "http://127.0.0.1:8000";

export const bookHandlers = [
  http.get(`${apiUrl}/books/:id/pdf`, ({ params }) =>
    HttpResponse.json({
      url: `https://storage.booker.test/books/${params.id}.pdf`,
      expires_in: 900,
    }),
  ),
  http.get(
    "https://storage.booker.test/books/:filename",
    () => new HttpResponse(makePreviewPdf(), { headers: { "Content-Type": "application/pdf" } }),
  ),
  http.get(`${apiUrl}/books`, ({ request }) => {
    const url = new URL(request.url);
    const offset = Number(url.searchParams.get("offset") ?? 0);
    const limit = Number(url.searchParams.get("limit") ?? 20);

    return HttpResponse.json(library.slice(offset, offset + limit));
  }),
  http.post(`${apiUrl}/books`, async ({ request }) => {
    const body = (await request.json()) as { filename: string; object_key: string };
    const upload = [...uploads.values()].find((item) => item.objectKey === body.object_key);

    if (!upload?.complete || upload.filename !== body.filename) {
      return HttpResponse.json(
        { detail: "Upload the PDF before adding the book." },
        { status: 400 },
      );
    }

    if (library.some((book) => book.id === body.object_key)) {
      return HttpResponse.json(
        { detail: "This book is already in your library." },
        { status: 409 },
      );
    }

    const book = makeBook({
      id: body.object_key,
      filename: body.filename,
      status: "uploading",
      active_index_id: null,
      thumbnail_url: null,
    });

    library.unshift(book);

    return HttpResponse.json(
      { ...book, ingestion: { id: "index-new", status: "building" } },
      { status: 201 },
    );
  }),
];
