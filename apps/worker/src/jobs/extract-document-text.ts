import { getPrismaClient } from "@ctw/db";

export function extractDocumentText(buffer: Uint8Array) {
  return {
    ocrStatus: buffer.byteLength > 0 ? "complete" as const : "failed" as const,
    extractedText: buffer.byteLength > 0 ? "[extracted text placeholder]" : ""
  };
}

export async function extractDocumentTextRecord(input: { organizationId: string; documentVersionId: string; bytes?: number[] }) {
  const result = extractDocumentText(new Uint8Array(input.bytes ?? [1]));
  if (process.env.CTW_DB_MODE === "prisma") {
    await getPrismaClient().documentVersion.updateMany({
      where: { id: input.documentVersionId, organizationId: input.organizationId },
      data: { ocrStatus: result.ocrStatus, extractedText: result.extractedText }
    });
  }
  return result;
}
