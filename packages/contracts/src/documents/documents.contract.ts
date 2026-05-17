import { z } from "zod";
import { defineRoute } from "../common.js";
import { documentSchema, updateDocumentRequestSchema } from "./documents.schemas.js";
const dealParams = z.object({ dealId: z.string() });
const documentParams = z.object({ dealId: z.string(), documentId: z.string() });
export const documentsContract = [
  defineRoute({ method: "GET", path: "/v1/deals/:dealId/documents", summary: "List documents", tags: ["documents"], params: dealParams, response: z.array(documentSchema) }),
  defineRoute({ method: "POST", path: "/v1/deals/:dealId/documents", summary: "Upload document metadata", tags: ["documents"], params: dealParams, body: updateDocumentRequestSchema, response: documentSchema }),
  defineRoute({ method: "PATCH", path: "/v1/deals/:dealId/documents/:documentId", summary: "Update document", tags: ["documents"], params: documentParams, body: updateDocumentRequestSchema, response: documentSchema }),
  defineRoute({ method: "POST", path: "/v1/deals/:dealId/documents/:documentId/archive", summary: "Archive document", tags: ["documents"], params: documentParams, response: documentSchema })
];
