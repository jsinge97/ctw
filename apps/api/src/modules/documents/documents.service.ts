import type { CurrentSession, DocumentDto, UpdateDocumentRequest } from "@ctw/contracts";
import { getWorkflowProvider } from "../workflow-provider.js";

export async function listDocuments(dealId: string, session?: CurrentSession): Promise<DocumentDto[]> {
  const workflow = getWorkflowProvider();
  if (workflow.mode === "prisma" && workflow.prisma) {
    return workflow.prisma.listDocumentsForDeal(session?.activeOrganization.id ?? "org_northgate", dealId) as Promise<DocumentDto[]>;
  }
  return workflow.memory.documents.filter((document) => document.dealId === dealId);
}

export async function createDocument(dealId: string, input: UpdateDocumentRequest, session?: CurrentSession): Promise<DocumentDto> {
  const workflow = getWorkflowProvider();
  if (workflow.mode === "prisma" && workflow.prisma) {
    return workflow.prisma.createDocument({
      organizationId: session?.activeOrganization.id ?? "org_northgate",
      dealId,
      title: input.title ?? "Untitled document",
      documentType: input.documentType ?? "unknown",
      visibility: input.visibility ?? "internal",
      folder: input.folder ?? null,
      tags: input.tags ?? [],
      uploadedByMembershipId: session?.membership.id ?? null
    }) as Promise<DocumentDto>;
  }
  const document: DocumentDto = { id: workflow.memory.nextId("doc", workflow.memory.documents.length), dealId, title: input.title ?? "Untitled document", documentType: "unknown", classificationStatus: "pending", latestVersion: "v1", visibility: input.visibility ?? "internal", folder: input.folder ?? null, tags: input.tags ?? [] };
  workflow.memory.documents.push(document);
  return document;
}

export async function updateDocument(documentId: string, input: UpdateDocumentRequest, session?: CurrentSession): Promise<DocumentDto> {
  const workflow = getWorkflowProvider();
  if (workflow.mode === "prisma" && workflow.prisma) {
    return workflow.prisma.updateDocument({
      organizationId: session?.activeOrganization.id ?? "org_northgate",
      documentId,
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.documentType !== undefined ? { documentType: input.documentType } : {}),
      ...(input.visibility !== undefined ? { visibility: input.visibility } : {}),
      ...(input.folder !== undefined ? { folder: input.folder } : {}),
      ...(input.tags !== undefined ? { tags: input.tags } : {})
    }) as Promise<DocumentDto>;
  }
  const document = workflow.memory.documents.find((item) => item.id === documentId);
  if (!document) throw Object.assign(new Error("Document not found"), { statusCode: 404 });
  Object.assign(document, input);
  return document;
}
