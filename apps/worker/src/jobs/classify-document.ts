export function classifyDocument(filename: string) {
  const lower = filename.toLowerCase();
  if (lower.includes("loi")) return { documentType: "loi" as const, confidence: 0.91 };
  if (lower.includes("lease")) return { documentType: "lease" as const, confidence: 0.86 };
  if (lower.includes("estoppel")) return { documentType: "estoppel" as const, confidence: 0.82 };
  return { documentType: "unknown" as const, confidence: 0.3 };
}
