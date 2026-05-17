import type { AddParticipantRequest, CurrentSession, ParticipantDto, UpdateParticipantRequest } from "@ctw/contracts";
import { getWorkflowProvider } from "../workflow-provider.js";

export async function listParticipants(dealId: string, session?: CurrentSession): Promise<ParticipantDto[]> {
  const workflow = getWorkflowProvider();
  if (workflow.mode === "prisma" && workflow.prisma) {
    const includeInternal = !session || ["admin", "am"].includes(session.membership.role);
    const participants = (await workflow.prisma.listParticipants(session?.activeOrganization.id ?? "org_northgate", dealId, includeInternal)) as ParticipantDto[];
    return includeInternal ? participants : participants.map((participant) => ({ ...participant, capabilities: [] }));
  }
  const participants = workflow.memory.participants.filter((participant) => participant.dealId === dealId && participant.status !== "removed");
  if (session && !["admin", "am"].includes(session.membership.role)) return participants.filter((participant) => participant.visibility === "shared").map((participant) => ({ ...participant, capabilities: [] }));
  return participants;
}

export async function addParticipant(dealId: string, input: AddParticipantRequest, session?: CurrentSession): Promise<ParticipantDto> {
  const workflow = getWorkflowProvider();
  if (workflow.mode === "prisma" && workflow.prisma) return workflow.prisma.addParticipant({ organizationId: session?.activeOrganization.id ?? "org_northgate", dealId, name: input.name, company: input.company ?? null, role: input.role, capabilities: input.capabilities ?? [], actorMembershipId: session?.membership.id ?? null }) as Promise<ParticipantDto>;
  const contactId = workflow.memory.nextId("contact", workflow.memory.participants.length);
  const participant: ParticipantDto = { id: workflow.memory.nextId("part", workflow.memory.participants.length), dealId, subjectType: "contact", subjectId: contactId, membershipId: null, contactId, name: input.name, company: input.company ?? null, role: input.role, visibility: "shared", capabilities: input.capabilities ?? [], status: "active" };
  workflow.memory.participants.push(participant);
  return participant;
}

export async function updateParticipant(dealId: string, participantId: string, input: UpdateParticipantRequest, session?: CurrentSession): Promise<ParticipantDto> {
  const workflow = getWorkflowProvider();
  if (workflow.mode === "prisma" && workflow.prisma) {
    const patch: { organizationId: string; dealId: string; participantId: string; visibility?: "internal" | "shared"; capabilities?: string[]; status?: "active" | "removed"; actorMembershipId?: string | null } = { organizationId: session?.activeOrganization.id ?? "org_northgate", dealId, participantId, actorMembershipId: session?.membership.id ?? null };
    if (input.visibility !== undefined) patch.visibility = input.visibility;
    if (input.capabilities !== undefined) patch.capabilities = input.capabilities;
    if (input.status !== undefined) patch.status = input.status;
    return workflow.prisma.updateParticipant(patch) as Promise<ParticipantDto>;
  }
  const participant = workflow.memory.participants.find((item) => item.id === participantId && item.dealId === dealId);
  if (!participant) throw Object.assign(new Error("Participant not found"), { statusCode: 404 });
  Object.assign(participant, input);
  return participant;
}
