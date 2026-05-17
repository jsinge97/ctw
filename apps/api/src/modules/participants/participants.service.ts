import type { AddParticipantRequest, ParticipantDto, UpdateParticipantRequest } from "@ctw/contracts";
import { getWorkflowProvider } from "../workflow-provider.js";

const workflow = getWorkflowProvider().memory;

export function listParticipants(dealId: string): ParticipantDto[] {
  return workflow.participants.filter((participant) => participant.dealId === dealId && participant.status !== "removed");
}

export function addParticipant(dealId: string, input: AddParticipantRequest): ParticipantDto {
  const contactId = workflow.nextId("contact", workflow.participants.length);
  const participant: ParticipantDto = { id: workflow.nextId("part", workflow.participants.length), dealId, subjectType: "contact", subjectId: contactId, membershipId: null, contactId, name: input.name, company: input.company ?? null, role: input.role, visibility: "shared", capabilities: input.capabilities ?? [], status: "active" };
  workflow.participants.push(participant);
  return participant;
}

export function updateParticipant(participantId: string, input: UpdateParticipantRequest): ParticipantDto {
  const participant = workflow.participants.find((item) => item.id === participantId);
  if (!participant) throw Object.assign(new Error("Participant not found"), { statusCode: 404 });
  Object.assign(participant, input);
  return participant;
}
