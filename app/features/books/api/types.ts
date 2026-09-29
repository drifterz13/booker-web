export interface BookSummary {
  id: string;
  filename: string;
  status: "uploading" | "uploaded" | "failed";
  created_at: string;
  active_index_id?: string | null;
  thumbnail_url?: string | null;
}

export interface BookDetail extends BookSummary {
  ingestion?: { id: string; status: "building" | "ready" | "failed" } | null;
}

export interface Upload {
  upload_id: string;
  object_key: string;
}

export interface PartUrl {
  part_number: number;
  url: string;
  expires_in?: number;
}

export interface CompletedPart {
  part_number: number;
  etag: string;
}
