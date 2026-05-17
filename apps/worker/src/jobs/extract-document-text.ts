export function extractDocumentText(buffer: Uint8Array) {
  return {
    ocrStatus: buffer.byteLength > 0 ? "complete" as const : "failed" as const,
    extractedText: buffer.byteLength > 0 ? "[extracted text placeholder]" : ""
  };
}
