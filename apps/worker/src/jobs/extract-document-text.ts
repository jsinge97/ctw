import { getPrismaClient } from "@ctw/db";
import { createStorage } from "@ctw/storage";
import { analyzeDocument } from "./document-intelligence.js";

export async function extractDocumentText(buffer: Uint8Array, filename = "document.txt", mimeType = "text/plain") {
  if (process.env.CTW_AI_MODE === "live") return analyzeDocument({ bytes: buffer, filename, mimeType });
  return {
    ocrStatus: buffer.byteLength > 0 ? "complete" as const : "failed" as const,
    extractedText: buffer.byteLength > 0 ? new TextDecoder().decode(buffer).replace(/\s+/g, " ").trim() || `Fake OCR completed for ${filename}.` : ""
  };
}

export async function extractDocumentTextRecord(input: { organizationId: string; documentVersionId: string; bytes?: number[] }) {
  const prisma = getPrismaClient();
  const version = process.env.CTW_DB_MODE === "prisma"
    ? await prisma.documentVersion.findFirst({ where: { id: input.documentVersionId, organizationId: input.organizationId }, include: { document: true } })
    : null;
  const storedObject = version && !input.bytes ? await createStorage().get(version.storageKey) : undefined;
  const bytes = new Uint8Array(input.bytes ?? storedObject?.bytes ?? []);
  try {
    const result = await analyzeDocument({
      bytes,
      filename: version?.filename ?? "document.txt",
      mimeType: version?.mimeType ?? storedObject?.contentType ?? "text/plain"
    });
    if (process.env.CTW_DB_MODE === "prisma") {
      await prisma.documentVersion.updateMany({
        where: { id: input.documentVersionId, organizationId: input.organizationId },
        data: { ocrStatus: result.ocrStatus, extractedText: result.extractedText }
      });
      if (version) {
        await prisma.document.update({
          where: { id: version.documentId, organizationId: input.organizationId },
          data: { documentType: result.documentType, classificationStatus: result.classificationStatus }
        });
      }
    }
    return result;
  } catch (error) {
    if (process.env.CTW_DB_MODE === "prisma") {
      await prisma.documentVersion.updateMany({
        where: { id: input.documentVersionId, organizationId: input.organizationId },
        data: { ocrStatus: "failed", extractedText: error instanceof Error ? error.message : "Document intelligence failed" }
      });
      if (version) {
        await prisma.document.update({
          where: { id: version.documentId, organizationId: input.organizationId },
          data: { classificationStatus: "failed" }
        });
      }
    }
    throw error;
  }
}
