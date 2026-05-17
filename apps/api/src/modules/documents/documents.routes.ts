import type { FastifyInstance } from "fastify";
import { createDocument, listDocuments, updateDocument } from "./documents.service.js";

export async function registerDocumentsRoutes(app: FastifyInstance) {
  app.get<{ Params: { dealId: string } }>("/v1/deals/:dealId/documents", async (request) => listDocuments(request.params.dealId));
  app.post<{ Params: { dealId: string }; Body: any }>("/v1/deals/:dealId/documents", async (request) => createDocument(request.params.dealId, request.body as any));
  app.patch<{ Params: { documentId: string }; Body: any }>("/v1/deals/:dealId/documents/:documentId", async (request) => updateDocument(request.params.documentId, request.body as any));
}
