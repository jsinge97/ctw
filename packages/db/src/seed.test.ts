import { describe, expect, it } from "vitest";
import type { PrismaClient } from "./generated/client/index.js";
import { seedDatabase } from "./seed.js";
import { buildSeedData, seedIds } from "./seed-data.js";

describe("seed data contract", () => {
  it("creates the expected organization, users, memberships, and channels", () => {
    const seed = buildSeedData();

    expect(seed.organizations).toEqual([
      expect.objectContaining({
        id: seedIds.organization,
        name: "Northgate CRE",
        slug: "northgate",
        routingConfidenceThreshold: 0.8
      })
    ]);
    expect(seed.users).toHaveLength(5);
    expect(seed.memberships.map((membership) => membership.role).sort()).toEqual(["admin", "am", "broker", "client", "va"]);
    expect(seed.authSessions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ token: seedIds.authTokens.am, userId: seedIds.users.am, activeOrganizationId: seedIds.organization }),
        expect.objectContaining({ token: seedIds.authTokens.broker, userId: seedIds.users.broker, activeOrganizationId: seedIds.organization })
      ])
    );
    expect(seed.channels).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: seedIds.channels.email, channelType: "email", provider: "resend" }),
        expect.objectContaining({ id: seedIds.channels.sms, channelType: "sms", provider: "twilio" })
      ])
    );
  });

  it("seeds Sutter and Bryant equivalents with a single current next action", () => {
    const seed = buildSeedData();

    expect(seed.deals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: seedIds.deals.sutter, title: "Sutter Tower - Floor 14", stage: "loi" }),
        expect.objectContaining({ id: seedIds.deals.bryant, title: "401 Bryant - 12k sf office sublease", stage: "prospect" })
      ])
    );
    expect(seed.tasks.filter((task) => task.isCurrentNextAction)).toEqual([
      expect.objectContaining({
        id: seedIds.tasks.next,
        dealId: seedIds.deals.sutter,
        currentNextActionKey: `${seedIds.deals.sutter}:current-next-action`
      })
    ]);
    expect(seed.vaWorkItems).toEqual([
      expect.objectContaining({
        id: seedIds.vaWorkItems.estoppel,
        taskId: seedIds.tasks.va,
        status: "queued"
      })
    ]);
  });

  it("keeps external participants scoped through permissions rather than broad org access", () => {
    const seed = buildSeedData();

    const brokerPermissions = seed.permissionGrants.filter((grant) => grant.subjectId === seedIds.memberships.broker);
    const clientPermissions = seed.permissionGrants.filter((grant) => grant.subjectId === seedIds.memberships.client);

    expect(brokerPermissions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ scopeType: "deal", scopeId: seedIds.deals.sutter, capability: "deal.view" }),
        expect.objectContaining({ scopeType: "deal", scopeId: seedIds.deals.sutter, capability: "document.upload" })
      ])
    );
    expect(clientPermissions).toEqual([
      expect.objectContaining({ scopeType: "deal", scopeId: seedIds.deals.bryant, capability: "deal.view" })
    ]);
  });

  it("includes reviewable routing, documents, and audit history", () => {
    const seed = buildSeedData();

    expect(seed.messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: seedIds.messages.loi, routingStatus: "routed", routingConfidence: 0.97 }),
        expect.objectContaining({ id: seedIds.messages.unknown, routingStatus: "review_required", routingConfidence: 0.41 })
      ])
    );
    expect(seed.routingReviewItems).toEqual([
      expect.objectContaining({ id: seedIds.routingReviewItems.unknown, messageId: seedIds.messages.unknown, suggestedDealId: seedIds.deals.bryant, status: "open" })
    ]);
    expect(seed.documents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: seedIds.documents.loi, documentType: "loi", classificationStatus: "classified" }),
        expect.objectContaining({ id: seedIds.documents.esa, documentType: "unknown", classificationStatus: "pending" })
      ])
    );
    expect(seed.auditEvents.map((event) => event.eventType)).toEqual(["message.routed", "task.approved"]);
  });

  it("executes reset before seed creates in dependency order", async () => {
    const operations: string[] = [];
    const tx = createRecordingTransaction(operations);
    const prisma = {
      async $transaction<T>(callback: (transaction: typeof tx) => Promise<T>) {
        return callback(tx);
      }
    } as unknown as PrismaClient;

    const result = await seedDatabase(prisma);

    expect(result.counts).toMatchObject({
      organizations: 1,
      users: 5,
      memberships: 5,
      authSessions: 5,
      deals: 2,
      tasks: 2,
      auditEvents: 2
    });
    expect(operations.indexOf("delete:approvalEvent")).toBeLessThan(operations.indexOf("delete:organization"));
    expect(operations.indexOf("delete:organization")).toBeLessThan(operations.indexOf("create:organization"));
    expect(operations.indexOf("create:organization")).toBeLessThan(operations.indexOf("create:user"));
    expect(operations.indexOf("create:user")).toBeLessThan(operations.indexOf("create:organizationMembership"));
    expect(operations.indexOf("create:task")).toBeLessThan(operations.indexOf("create:vaWorkItem"));
  });
});

function createRecordingTransaction(operations: string[]) {
  const counts = new Map<string, number>();
  return new Proxy(
    {},
    {
      get(_target, modelName: string) {
        return {
          async deleteMany() {
            operations.push(`delete:${modelName}`);
            return { count: 0 };
          },
          async createMany(input: { data: unknown[] }) {
            operations.push(`create:${modelName}`);
            const count = input.data.length;
            counts.set(modelName, count);
            return { count };
          }
        };
      }
    }
  ) as Record<string, { deleteMany: () => Promise<{ count: number }>; createMany: (input: { data: unknown[] }) => Promise<{ count: number }> }>;
}
