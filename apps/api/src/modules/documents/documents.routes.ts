import type { FastifyInstance } from "fastify";
import { updateDocumentRequestSchema } from "@ctw/contracts";
import { getRequiredSession } from "../authz.js";
import { parseBody } from "../validation.js";
import { archiveDocument, createDocument, listDocuments, updateDocument, uploadDocument } from "./documents.service.js";

export async function registerDocumentsRoutes(app: FastifyInstance) {
  app.get<{ Params: { dealId: string } }>("/v1/deals/:dealId/documents", async (request) => listDocuments(request.params.dealId, getRequiredSession(request)));
  app.post<{ Params: { dealId: string } }>("/v1/deals/:dealId/documents", async (request) => createDocument(request.params.dealId, parseBody(updateDocumentRequestSchema, request.body), getRequiredSession(request)));
  app.post<{ Params: { dealId: string } }>("/v1/deals/:dealId/documents/upload", async (request) => {
    const file = await request.file();
    if (!file) throw Object.assign(new Error("File is required"), { statusCode: 400 });
    return uploadDocument(request.params.dealId, { filename: file.filename, contentType: file.mimetype, bytes: await file.toBuffer() }, getRequiredSession(request));
  });
  app.patch<{ Params: { dealId: string; documentId: string } }>("/v1/deals/:dealId/documents/:documentId", async (request) => updateDocument(request.params.dealId, request.params.documentId, parseBody(updateDocumentRequestSchema, request.body), getRequiredSession(request)));
  app.post<{ Params: { dealId: string; documentId: string } }>("/v1/deals/:dealId/documents/:documentId/archive", async (request) => archiveDocument(request.params.dealId, request.params.documentId, getRequiredSession(request)));
}
