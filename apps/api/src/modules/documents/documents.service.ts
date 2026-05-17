import type { DocumentDto, UpdateDocumentRequest } from "@ctw/contracts";
import { documents, nextId } from "../demo-store.js";

export function listDocuments(dealId: string): DocumentDto[] {
  return documents.filter((document) => document.dealId === dealId);
}

export function createDocument(dealId: string, input: UpdateDocumentRequest): DocumentDto {
  const document: DocumentDto = { id: nextId("doc", documents.length), dealId, title: input.title ?? "Untitled document", documentType: "unknown", classificationStatus: "pending", latestVersion: "v1", visibility: input.visibility ?? "internal", folder: input.folder ?? null, tags: input.tags ?? [] };
  documents.push(document);
  return document;
}

export function updateDocument(documentId: string, input: UpdateDocumentRequest): DocumentDto {
  const document = documents.find((item) => item.id === documentId);
  if (!document) throw Object.assign(new Error("Document not found"), { statusCode: 404 });
  Object.assign(document, input);
  return document;
}
