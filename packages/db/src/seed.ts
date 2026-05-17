import { getPrismaClient } from "./prisma.js";
import type { PrismaClient } from "./generated/client/index.js";
import { buildSeedData } from "./seed-data.js";
import { resetSeedData } from "./reset.js";

export async function seedDatabase(prisma: PrismaClient = getPrismaClient()) {
  const seed = buildSeedData();
  await resetSeedData(prisma);

  return prisma.$transaction(async (tx) => {
    const organizations = await tx.organization.createMany({ data: seed.organizations });
    const users = await tx.user.createMany({ data: seed.users });
    const memberships = await tx.organizationMembership.createMany({ data: seed.memberships });
    const companies = await tx.company.createMany({ data: seed.companies });
    const contacts = await tx.contact.createMany({ data: seed.contacts });
    const channels = await tx.channel.createMany({ data: seed.channels });
    const deals = await tx.deal.createMany({ data: seed.deals });
    const dealParticipants = await tx.dealParticipant.createMany({ data: seed.dealParticipants });
    const permissionGrants = await tx.permissionGrant.createMany({ data: seed.permissionGrants });
    const messages = await tx.message.createMany({ data: seed.messages });
    const messageParticipants = await tx.messageParticipant.createMany({ data: seed.messageParticipants });
    const routingReviewItems = await tx.routingReviewItem.createMany({ data: seed.routingReviewItems });
    const documents = await tx.document.createMany({ data: seed.documents });
    const documentVersions = await tx.documentVersion.createMany({ data: seed.documentVersions });
    const tasks = await tx.task.createMany({ data: seed.tasks });
    const vaWorkItems = await tx.vaWorkItem.createMany({ data: seed.vaWorkItems });
    const taskOutcomes = await tx.taskOutcome.createMany({ data: seed.taskOutcomes });
    const approvalEvents = await tx.approvalEvent.createMany({ data: seed.approvalEvents });
    const auditEvents = await tx.auditEvent.createMany({ data: seed.auditEvents });

    return {
      organizationId: seed.organizationId,
      counts: {
        organizations: organizations.count,
        users: users.count,
        memberships: memberships.count,
        companies: companies.count,
        contacts: contacts.count,
        channels: channels.count,
        deals: deals.count,
        dealParticipants: dealParticipants.count,
        permissionGrants: permissionGrants.count,
        messages: messages.count,
        messageParticipants: messageParticipants.count,
        routingReviewItems: routingReviewItems.count,
        documents: documents.count,
        documentVersions: documentVersions.count,
        tasks: tasks.count,
        vaWorkItems: vaWorkItems.count,
        taskOutcomes: taskOutcomes.count,
        approvalEvents: approvalEvents.count,
        auditEvents: auditEvents.count
      }
    };
  });
}

async function main() {
  const prisma = getPrismaClient();
  try {
    const result = await seedDatabase(prisma);
    console.log(`Seeded ${result.organizationId}`);
    console.log(JSON.stringify(result.counts, null, 2));
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
