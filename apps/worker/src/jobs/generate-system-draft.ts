import { getPrismaClient } from "@ctw/db";

export function generateSystemDraft(input: { dealTitle: string; taskTitle: string }) {
  return {
    subject: input.taskTitle,
    bodyText: `Hi,\n\nFollowing up on ${input.dealTitle}. ${input.taskTitle}.\n\nBest,\nCTW`,
    recipients: [] as string[]
  };
}

export async function generateSystemDraftRecord(input: { taskId: string; dealId: string }) {
  if (process.env.CTW_DB_MODE !== "prisma") return generateSystemDraft({ dealTitle: input.dealId, taskTitle: input.taskId });
  const prisma = getPrismaClient();
  const task = await prisma.task.findFirst({ where: { id: input.taskId, dealId: input.dealId }, include: { deal: true } });
  if (!task) throw new Error("Task not found");
  const draft = generateSystemDraft({ dealTitle: task.deal.title, taskTitle: task.title });
  await prisma.task.update({
    where: { id: task.id },
    data: { payload: { draft: draft.bodyText, recipients: draft.recipients }, status: "waiting_approval" }
  });
  return draft;
}
