import type { FastifyInstance } from "fastify";
import { updateDocumentRequestSchema } from "@ctw/contracts";
import { parseBody } from "../validation.js";
import { createDocument, listDocuments, updateDocument } from "./documents.service.js";

export async function registerDocumentsRoutes(app: FastifyInstance) {
  app.get<{ Params: { dealId: string } }>("/v1/deals/:dealId/documents", async (request) => listDocuments(request.params.dealId));
  app.post<{ Params: { dealId: string } }>("/v1/deals/:dealId/documents", async (request) => createDocument(request.params.dealId, parseBody(updateDocumentRequestSchema, request.body)));
  app.patch<{ Params: { documentId: string } }>("/v1/deals/:dealId/documents/:documentId", async (request) => updateDocument(request.params.documentId, parseBody(updateDocumentRequestSchema, request.body)));
}
