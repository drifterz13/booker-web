export const MAX_BOOK_SIZE = 100 * 1024 * 1024;

export function validateBook(file: Pick<File, "name" | "size" | "type">): string | null {
  if (!file.name.toLowerCase().endsWith(".pdf") || (file.type && file.type !== "application/pdf")) {
    return "Please choose a PDF file.";
  }

  if (file.size === 0) return "This file is empty. Choose another PDF.";

  if (file.size > MAX_BOOK_SIZE) return "Your PDF must be 100 MB or smaller.";

  return null;
}

export function formatBookSize(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
