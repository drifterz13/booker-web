import * as v from "valibot";
import { ApiErrorBodySchema } from "./schemas";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000").replace(
  /\/$/,
  "",
);

export async function readApiError(response: Response, fallback: string): Promise<ApiError> {
  const body: unknown = await response.json().catch(() => undefined);
  const result = v.safeParse(ApiErrorBodySchema, body);

  return new ApiError(response.status, result.success ? result.output.detail : fallback);
}

export async function apiRequest<TSchema extends v.GenericSchema>(
  path: string,
  schema: TSchema,
  options: RequestInit = {},
): Promise<v.InferOutput<TSchema>> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw await readApiError(response, `Request failed (${response.status}). Please try again.`);
  }

  const body: unknown =
    response.status === 204 ? undefined : await response.json().catch(() => undefined);

  options.signal?.throwIfAborted();

  const result = v.safeParse(schema, body);

  if (!result.success) throw new Error("The API returned an invalid response. Please try again.");

  return result.output;
}
