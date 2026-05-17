import type { z } from "zod";

export function parseBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw Object.assign(new Error("Invalid request body"), { statusCode: 400, validation: parsed.error.flatten() });
  }
  return parsed.data;
}
