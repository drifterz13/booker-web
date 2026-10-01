import * as v from "valibot";

export const NonEmptyStringSchema = v.pipe(
  v.string(),
  v.check((value) => value.trim().length > 0),
);
export const PositiveIntegerSchema = v.pipe(v.number(), v.safeInteger(), v.minValue(1));
export const ApiErrorBodySchema = v.object({ detail: NonEmptyStringSchema });
