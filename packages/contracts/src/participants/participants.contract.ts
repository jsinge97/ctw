import { z } from "zod";
import { defineRoute } from "../common.js";
import { addParticipantRequestSchema, participantSchema, updateParticipantRequestSchema } from "./participants.schemas.js";

const dealParams = z.object({ dealId: z.string() });
const participantParams = z.object({ dealId: z.string(), participantId: z.string() });

export const participantsContract = [
  defineRoute({ method: "GET", path: "/v1/deals/:dealId/participants", summary: "List participants", tags: ["participants"], params: dealParams, response: z.array(participantSchema) }),
  defineRoute({ method: "POST", path: "/v1/deals/:dealId/participants", summary: "Add participant", tags: ["participants"], params: dealParams, body: addParticipantRequestSchema, response: participantSchema }),
  defineRoute({ method: "PATCH", path: "/v1/deals/:dealId/participants/:participantId", summary: "Update participant", tags: ["participants"], params: participantParams, body: updateParticipantRequestSchema, response: participantSchema })
];
