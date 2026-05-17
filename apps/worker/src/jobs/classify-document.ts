import { getPrismaClient } from "@ctw/db";
import { classifyDocumentFromText } from "./document-intelligence.js";

export function classifyDocument(filename: string) {
  return classifyDocumentFromText(filename);
}

export async function classifyDocumentRecord(input: { organizationId: string; documentId: string }) {
  if (process.env.CTW_DB_MODE !== "prisma") return classifyDocument(input.documentId);
  const prisma = getPrismaClient();
  const document = await prisma.document.findFirst({
    where: { id: input.documentId, organizationId: input.organizationId },
    include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } }
  });
  if (!document) throw new Error("Document not found");
  const classification = classifyDocumentFromText(document.title, document.versions[0]?.extractedText ?? "");
  await prisma.document.update({
    where: { id: document.id, organizationId: input.organizationId },
    data: { documentType: classification.documentType, classificationStatus: classification.documentType === "unknown" ? "failed" : "classified" }
  });
  return classification;
}
