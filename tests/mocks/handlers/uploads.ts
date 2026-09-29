import { http, HttpResponse } from "msw";
import { apiUrl } from "./books";
import { uploads } from "../state";

export const uploadHandlers = [
  http.post(`${apiUrl}/uploads`, async ({ request }) => {
    const { filename } = (await request.json()) as { filename: string };
    const id = crypto.randomUUID();
    const objectKey = `books/${id}/${filename}`;

    uploads.set(id, { filename, objectKey, parts: new Map(), complete: false });

    return HttpResponse.json({ upload_id: id, object_key: objectKey }, { status: 201 });
  }),
  http.post(`${apiUrl}/uploads/:id/parts`, async ({ params, request }) => {
    const upload = uploads.get(String(params.id));
    const body = (await request.json()) as { object_key: string; part_numbers: number[] };

    if (!upload || upload.objectKey !== body.object_key) {
      return HttpResponse.json({ detail: "Upload not found." }, { status: 404 });
    }

    return HttpResponse.json(
      body.part_numbers.map((number) => ({
        part_number: number,
        url: `https://storage.booker.test/uploads/${params.id}/${number}`,
        expires_in: 900,
      })),
    );
  }),
  http.put("https://storage.booker.test/uploads/:id/:part", async ({ params, request }) => {
    const upload = uploads.get(String(params.id));

    if (!upload) return new HttpResponse(null, { status: 404 });

    if ((await request.arrayBuffer()).byteLength === 0)
      return new HttpResponse(null, { status: 400 });

    const etag = `"part-${params.part}"`;

    upload.parts.set(Number(params.part), etag);

    return new HttpResponse(null, { headers: { ETag: etag } });
  }),
  http.post(`${apiUrl}/uploads/:id/complete`, async ({ params, request }) => {
    const upload = uploads.get(String(params.id));
    const body = (await request.json()) as {
      object_key: string;
      parts: { part_number: number; etag: string }[];
    };

    if (
      !upload ||
      upload.objectKey !== body.object_key ||
      !body.parts.length ||
      body.parts.some((part) => upload.parts.get(part.part_number) !== part.etag)
    ) {
      return HttpResponse.json({ detail: "The PDF upload is incomplete." }, { status: 400 });
    }

    upload.complete = true;

    return HttpResponse.json({ object_key: upload.objectKey, etag: '"complete"' });
  }),
  http.delete(`${apiUrl}/uploads/:id`, ({ params }) => {
    uploads.delete(String(params.id));

    return new HttpResponse(null, { status: 204 });
  }),
];
