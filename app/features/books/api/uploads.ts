import { apiRequest } from "~/shared/api/client";
import type { CompletedPart, PartUrl, Upload } from "./types";

export function startUpload(filename: string) {
  return apiRequest<Upload>("/uploads", { method: "POST", body: JSON.stringify({ filename }) });
}

export function signParts(upload: Upload, partNumbers: number[], signal?: AbortSignal) {
  return apiRequest<PartUrl[]>(`/uploads/${encodeURIComponent(upload.upload_id)}/parts`, {
    method: "POST",
    signal,
    body: JSON.stringify({ object_key: upload.object_key, part_numbers: partNumbers }),
  });
}

export function completeUpload(upload: Upload, parts: CompletedPart[]) {
  return apiRequest<{ object_key: string; etag: string }>(
    `/uploads/${encodeURIComponent(upload.upload_id)}/complete`,
    {
      method: "POST",
      body: JSON.stringify({ object_key: upload.object_key, parts }),
    },
  );
}

export function abortUpload(upload: Upload) {
  return apiRequest<void>(
    `/uploads/${encodeURIComponent(upload.upload_id)}?object_key=${encodeURIComponent(upload.object_key)}`,
    {
      method: "DELETE",
    },
  );
}
