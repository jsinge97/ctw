import type { CurrentSession, DocumentDto, UpdateDocumentRequest } from "@ctw/contracts";
import { createHash } from "node:crypto";
import { createStorage } from "@ctw/storage";
import { getWorkflowProvider } from "../workflow-provider.js";

export type UploadDocumentInput = {
  filename: string;
  contentType: string;
  bytes: Uint8Array;
  title?: string;
  visibility?: "internal" | "shared";
  folder?: string | null;
  tags?: string[];
};

export async function listDocuments(dealId: string, session?: CurrentSession): Promise<DocumentDto[]> {
  const workflow = getWorkflowProvider();
  if (workflow.mode === "prisma" && workflow.prisma) {
    const includeInternal = !session || ["admin", "am"].includes(session.membership.role);
    return workflow.prisma.listDocumentsForDeal(session?.activeOrganization.id ?? "org_northgate", dealId, includeInternal) as Promise<DocumentDto[]>;
  }
  const documents = workflow.memory.documents.filter((document) => document.dealId === dealId);
  if (session && !["admin", "am"].includes(session.membership.role)) return documents.filter((document) => document.visibility === "shared");
  return documents;
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

export async function uploadDocument(dealId: string, input: UploadDocumentInput, session: CurrentSession): Promise<DocumentDto> {
  return createStoredDocument({
    organizationId: session.activeOrganization.id,
    dealId,
    uploadedByMembershipId: session.membership.id,
    input
  });
}

export async function createStoredDocument(options: { organizationId: string; dealId: string; uploadedByMembershipId: string | null; input: UploadDocumentInput }): Promise<DocumentDto> {
  return createStoredDocumentForSource({ ...options, sourceMessageId: null });
}

export async function createStoredDocumentForSource(options: { organizationId: string; dealId: string | null; sourceMessageId?: string | null; uploadedByMembershipId: string | null; input: UploadDocumentInput }): Promise<DocumentDto> {
  const workflow = getWorkflowProvider();
  const checksum = createHash("sha256").update(options.input.bytes).digest("hex");
  const storageKey = `${options.organizationId}/${options.dealId ?? "unfiled"}/${Date.now()}-${sanitizeFilename(options.input.filename)}`;
  await createStorage().put({ key: storageKey, contentType: options.input.contentType, bytes: options.input.bytes });

  if (workflow.mode === "prisma" && workflow.prisma) {
    return workflow.prisma.createDocument({
      organizationId: options.organizationId,
      dealId: options.dealId,
      sourceMessageId: options.sourceMessageId ?? null,
      title: options.input.title ?? options.input.filename,
      documentType: "unknown",
      visibility: options.input.visibility ?? "internal",
      folder: options.input.folder ?? null,
      tags: options.input.tags ?? [],
      uploadedByMembershipId: options.uploadedByMembershipId,
      version: {
        storageKey,
        filename: options.input.filename,
        mimeType: options.input.contentType,
        fileSizeBytes: options.input.bytes.byteLength,
        checksum
      }
    }) as Promise<DocumentDto>;
  }

  const document: DocumentDto = { id: workflow.memory.nextId("doc", workflow.memory.documents.length), dealId: options.dealId, title: options.input.title ?? options.input.filename, documentType: "unknown", classificationStatus: "pending", latestVersion: "v1", visibility: options.input.visibility ?? "internal", folder: options.input.folder ?? null, tags: options.input.tags ?? [] };
  workflow.memory.documents.push(document);
  return document;
}

export async function updateDocument(dealId: string, documentId: string, input: UpdateDocumentRequest, session?: CurrentSession): Promise<DocumentDto> {
  const workflow = getWorkflowProvider();
  if (workflow.mode === "prisma" && workflow.prisma) {
    return workflow.prisma.updateDocument({
      organizationId: session?.activeOrganization.id ?? "org_northgate",
      dealId,
      documentId,
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.documentType !== undefined ? { documentType: input.documentType } : {}),
      ...(input.visibility !== undefined ? { visibility: input.visibility } : {}),
      ...(input.folder !== undefined ? { folder: input.folder } : {}),
      ...(input.tags !== undefined ? { tags: input.tags } : {})
    }) as Promise<DocumentDto>;
  }
  const document = workflow.memory.documents.find((item) => item.id === documentId && item.dealId === dealId);
  if (!document) throw Object.assign(new Error("Document not found"), { statusCode: 404 });
  Object.assign(document, input);
  return document;
}

export async function archiveDocument(dealId: string, documentId: string, session: CurrentSession): Promise<DocumentDto> {
  const workflow = getWorkflowProvider();
  if (workflow.mode === "prisma" && workflow.prisma) {
    return workflow.prisma.archiveDocument({
      organizationId: session.activeOrganization.id,
      dealId,
      documentId
    }) as Promise<DocumentDto>;
  }
  const document = workflow.memory.documents.find((item) => item.id === documentId && item.dealId === dealId);
  if (!document) throw Object.assign(new Error("Document not found"), { statusCode: 404 });
  workflow.memory.documents = workflow.memory.documents.filter((item) => item.id !== documentId);
  return document;
}

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "upload";
}
