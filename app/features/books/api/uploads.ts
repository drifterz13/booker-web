import { apiRequest } from "~/shared/api/client";
import type { CompletedPart, Upload } from "./types";
import {
  CompletedUploadSchema,
  EmptyResponseSchema,
  PartUrlsSchema,
  UploadSchema,
} from "./schemas";

export function startUpload(filename: string) {
  return apiRequest("/uploads", UploadSchema, {
    method: "POST",
    body: JSON.stringify({ filename }),
  });
}

export function signParts(upload: Upload, partNumbers: number[], signal?: AbortSignal) {
  return apiRequest(`/uploads/${encodeURIComponent(upload.upload_id)}/parts`, PartUrlsSchema, {
    method: "POST",
    signal,
    body: JSON.stringify({ object_key: upload.object_key, part_numbers: partNumbers }),
  });
}

export function completeUpload(upload: Upload, parts: CompletedPart[]) {
  return apiRequest(
    `/uploads/${encodeURIComponent(upload.upload_id)}/complete`,
    CompletedUploadSchema,
    {
      method: "POST",
      body: JSON.stringify({ object_key: upload.object_key, parts }),
    },
  );
}

export function abortUpload(upload: Upload) {
  return apiRequest(
    `/uploads/${encodeURIComponent(upload.upload_id)}?object_key=${encodeURIComponent(upload.object_key)}`,
    EmptyResponseSchema,
    {
      method: "DELETE",
    },
  );
}
