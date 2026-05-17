const sensitiveKeys = new Set(["bodyText", "bodyHtml", "rawBody", "extractedText", "rawSource", "documentBody"]);

export function sanitizeAuditPayload<T>(value: T): T {
  if (Array.isArray(value)) return value.map((item) => sanitizeAuditPayload(item)) as T;
  if (!value || typeof value !== "object") return value;

  const sanitized: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value)) {
    if (sensitiveKeys.has(key)) {
      sanitized[key] = "[redacted]";
      continue;
    }
    sanitized[key] = sanitizeAuditPayload(nested);
  }
  return sanitized as T;
}
