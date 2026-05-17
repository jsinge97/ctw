import type { AddParticipantRequest, CurrentSession, ParticipantDto, UpdateParticipantRequest } from "@ctw/contracts";
import { getWorkflowProvider } from "../workflow-provider.js";

export async function listParticipants(dealId: string, session?: CurrentSession): Promise<ParticipantDto[]> {
  const workflow = getWorkflowProvider();
  if (workflow.mode === "prisma" && workflow.prisma) return workflow.prisma.listParticipants(session?.activeOrganization.id ?? "org_northgate", dealId) as Promise<ParticipantDto[]>;
  return workflow.memory.participants.filter((participant) => participant.dealId === dealId && participant.status !== "removed");
}

export async function addParticipant(dealId: string, input: AddParticipantRequest, session?: CurrentSession): Promise<ParticipantDto> {
  const workflow = getWorkflowProvider();
  if (workflow.mode === "prisma" && workflow.prisma) return workflow.prisma.addParticipant({ organizationId: session?.activeOrganization.id ?? "org_northgate", dealId, name: input.name, company: input.company ?? null, role: input.role, capabilities: input.capabilities ?? [] }) as Promise<ParticipantDto>;
  const contactId = workflow.memory.nextId("contact", workflow.memory.participants.length);
  const participant: ParticipantDto = { id: workflow.memory.nextId("part", workflow.memory.participants.length), dealId, subjectType: "contact", subjectId: contactId, membershipId: null, contactId, name: input.name, company: input.company ?? null, role: input.role, visibility: "shared", capabilities: input.capabilities ?? [], status: "active" };
  workflow.memory.participants.push(participant);
  return participant;
}

export async function updateParticipant(participantId: string, input: UpdateParticipantRequest, session?: CurrentSession): Promise<ParticipantDto> {
  const workflow = getWorkflowProvider();
  if (workflow.mode === "prisma" && workflow.prisma) {
    const patch: { organizationId: string; participantId: string; visibility?: "internal" | "shared"; capabilities?: string[]; status?: "active" | "removed" } = { organizationId: session?.activeOrganization.id ?? "org_northgate", participantId };
    if (input.visibility !== undefined) patch.visibility = input.visibility;
    if (input.capabilities !== undefined) patch.capabilities = input.capabilities;
    if (input.status !== undefined) patch.status = input.status;
    return workflow.prisma.updateParticipant(patch) as Promise<ParticipantDto>;
  }
  const participant = workflow.memory.participants.find((item) => item.id === participantId);
  if (!participant) throw Object.assign(new Error("Participant not found"), { statusCode: 404 });
  Object.assign(participant, input);
  return participant;
}
