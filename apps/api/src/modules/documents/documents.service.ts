import type { DocumentDto, UpdateDocumentRequest } from "@ctw/contracts";
import { getWorkflowProvider } from "../workflow-provider.js";

const workflow = getWorkflowProvider().memory;

export function listDocuments(dealId: string): DocumentDto[] {
  return workflow.documents.filter((document) => document.dealId === dealId);
}

export function createDocument(dealId: string, input: UpdateDocumentRequest): DocumentDto {
  const document: DocumentDto = { id: workflow.nextId("doc", workflow.documents.length), dealId, title: input.title ?? "Untitled document", documentType: "unknown", classificationStatus: "pending", latestVersion: "v1", visibility: input.visibility ?? "internal", folder: input.folder ?? null, tags: input.tags ?? [] };
  workflow.documents.push(document);
  return document;
}

export function updateDocument(documentId: string, input: UpdateDocumentRequest): DocumentDto {
  const document = workflow.documents.find((item) => item.id === documentId);
  if (!document) throw Object.assign(new Error("Document not found"), { statusCode: 404 });
  Object.assign(document, input);
  return document;
}
