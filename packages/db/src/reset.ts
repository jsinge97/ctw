import { getPrismaClient } from "./prisma.js";
import type { PrismaClient } from "./generated/client/index.js";
import { seedIds } from "./seed-data.js";

export async function resetSeedData(prisma: PrismaClient = getPrismaClient()) {
  const organizationId = seedIds.organization;
  const userIds = Object.values(seedIds.users);

  await prisma.$transaction(async (tx) => {
    await tx.approvalEvent.deleteMany({ where: { organizationId } });
    await tx.auditEvent.deleteMany({ where: { organizationId } });
    await tx.taskOutcome.deleteMany({ where: { organizationId } });
    await tx.vaWorkItem.deleteMany({ where: { organizationId } });
    await tx.documentVersion.deleteMany({ where: { organizationId } });
    await tx.document.deleteMany({ where: { organizationId } });
    await tx.routingReviewItem.deleteMany({ where: { organizationId } });
    await tx.messageParticipant.deleteMany({ where: { organizationId } });
    await tx.message.deleteMany({ where: { organizationId } });
    await tx.task.deleteMany({ where: { organizationId } });
    await tx.permissionGrant.deleteMany({ where: { organizationId } });
    await tx.dealParticipant.deleteMany({ where: { organizationId } });
    await tx.deal.deleteMany({ where: { organizationId } });
    await tx.contact.deleteMany({ where: { organizationId } });
    await tx.channel.deleteMany({ where: { organizationId } });
    await tx.organizationMembership.deleteMany({ where: { organizationId } });
    await tx.company.deleteMany({ where: { organizationId } });
    await tx.organization.deleteMany({ where: { id: organizationId } });
    await tx.user.deleteMany({ where: { id: { in: userIds } } });
  });
}

async function main() {
  const prisma = getPrismaClient();
  try {
    await resetSeedData(prisma);
    console.log(`Reset seed data for ${seedIds.organization}`);
  } finally {
    await prisma.$disconnect();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
