import { PrismaWorkflowRepository, getPrismaClient } from "@ctw/db";

export function proposeNextAction(input: { dealId: string; sourceMessageSubject?: string }) {
  const title = input.sourceMessageSubject?.toLowerCase().includes("loi") ? "Send LOI response" : "Review latest inbound message";
  return { dealId: input.dealId, title, route: "system" as const, confidence: 0.84 };
}

export async function proposeNextActionRecord(input: { organizationId?: string; dealId: string; sourceMessageSubject?: string }) {
  const proposal = proposeNextAction(input);
  if (process.env.CTW_DB_MODE === "prisma") {
    const repository = new PrismaWorkflowRepository(getPrismaClient());
    await repository.createTask({
      organizationId: input.organizationId ?? "org_northgate",
      dealId: input.dealId,
      title: proposal.title,
      route: proposal.route,
      payload: { proposedBy: "worker", confidence: proposal.confidence }
    });
  }
  return proposal;
}
