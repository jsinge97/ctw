import { getPrismaClient } from "@ctw/db";

export function classifyDocument(filename: string) {
  const lower = filename.toLowerCase();
  if (lower.includes("loi")) return { documentType: "loi" as const, confidence: 0.91 };
  if (lower.includes("lease")) return { documentType: "lease" as const, confidence: 0.86 };
  if (lower.includes("estoppel")) return { documentType: "estoppel" as const, confidence: 0.82 };
  return { documentType: "unknown" as const, confidence: 0.3 };
}

export async function classifyDocumentRecord(input: { documentId: string }) {
  if (process.env.CTW_DB_MODE !== "prisma") return classifyDocument(input.documentId);
  const prisma = getPrismaClient();
  const document = await prisma.document.findUnique({ where: { id: input.documentId }, select: { id: true, title: true } });
  if (!document) throw new Error("Document not found");
  const classification = classifyDocument(document.title);
  await prisma.document.update({
    where: { id: document.id },
    data: { documentType: classification.documentType, classificationStatus: classification.documentType === "unknown" ? "failed" : "classified" }
  });
  return classification;
}
