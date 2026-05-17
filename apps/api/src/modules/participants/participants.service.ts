import type { AddParticipantRequest, ParticipantDto, UpdateParticipantRequest } from "@ctw/contracts";
import { nextId, participants } from "../demo-store.js";

export function listParticipants(dealId: string): ParticipantDto[] {
  return participants.filter((participant) => participant.dealId === dealId && participant.status !== "removed");
}

export function addParticipant(dealId: string, input: AddParticipantRequest): ParticipantDto {
  const participant: ParticipantDto = { id: nextId("part", participants.length), dealId, name: input.name, company: input.company ?? null, role: input.role, visibility: "shared", capabilities: input.capabilities ?? [], status: "active" };
  participants.push(participant);
  return participant;
}

export function updateParticipant(participantId: string, input: UpdateParticipantRequest): ParticipantDto {
  const participant = participants.find((item) => item.id === participantId);
  if (!participant) throw Object.assign(new Error("Participant not found"), { statusCode: 404 });
  Object.assign(participant, input);
  return participant;
}
