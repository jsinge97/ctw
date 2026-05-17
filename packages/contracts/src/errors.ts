import { z } from "zod";

export const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
  requestId: z.string()
});

export type ApiError = z.infer<typeof apiErrorSchema>;

export function createApiError(code: string, message: string, requestId: string, details?: unknown): ApiError {
  return details === undefined ? { code, message, requestId } : { code, message, requestId, details };
}
