import { describe, expect, it } from "vitest";
import type { PrismaClient } from "../generated/client/index.js";
import { PrismaWorkflowRepository } from "./workflow.repository.js";

describe("PrismaWorkflowRepository", () => {
  it("lists organization-scoped deals and maps current next action", async () => {
    const calls: unknown[] = [];
    const prisma = {
      deal: {
        async findMany(args: unknown) {
          calls.push(args);
          return [
            {
              id: "deal_sutter",
              organizationId: "org_northgate",
              title: "Sutter Tower - Floor 14",
              primaryCompany: { name: "Halcyon Capital" },
              stage: "loi",
              status: "active",
              staleFlag: false,
              lastActivityAt: new Date("2026-05-17T14:00:00.000Z"),
              tasks: [{ title: "Send LOI response", isCurrentNextAction: true, status: "waiting_approval" }]
            }
          ];
        }
      }
    } as unknown as PrismaClient;

    const repository = new PrismaWorkflowRepository(prisma);
    await expect(repository.listDeals("org_northgate")).resolves.toEqual([
      expect.objectContaining({
        id: "deal_sutter",
        primaryCompanyName: "Halcyon Capital",
        nextActionLabel: "Send LOI response",
        pendingApprovals: 1
      })
    ]);
    expect(calls[0]).toMatchObject({ where: { organizationId: "org_northgate", status: { not: "archived" } } });
  });

  it("scopes external deal lists to active participant deals", async () => {
    const calls: unknown[] = [];
    const prisma = {
      dealParticipant: {
        async findMany() {
          return [{ dealId: "deal_sutter" }];
        }
      },
      deal: {
        async findMany(args: unknown) {
          calls.push(args);
          return [];
        }
      }
    } as unknown as PrismaClient;

    const repository = new PrismaWorkflowRepository(prisma);
    await repository.listDeals("org_northgate", "mem_broker", "broker");

    expect(calls[0]).toMatchObject({ where: { organizationId: "org_northgate", id: { in: ["deal_sutter"] } } });
  });

  it("sets exactly one current next action per deal in a transaction", async () => {
    const operations: string[] = [];
    const tx = {
      task: {
        async updateMany() {
          operations.push("clear-current");
          return { count: 1 };
        },
        async update() {
          operations.push("set-current");
          return {
            id: "task_next",
            dealId: "deal_sutter",
            title: "Send LOI response",
            description: null,
            status: "waiting_approval",
            route: "system",
            isCurrentNextAction: true,
            payload: {},
            dueAt: null
          };
        }
      }
    };
    const prisma = {
      async $transaction<T>(callback: (transaction: typeof tx) => Promise<T>) {
        return callback(tx);
      }
    } as unknown as PrismaClient;

    const repository = new PrismaWorkflowRepository(prisma);
    await expect(repository.setCurrentNextAction({ organizationId: "org_northgate", dealId: "deal_sutter", taskId: "task_next" })).resolves.toMatchObject({
      id: "task_next",
      isCurrentNextAction: true
    });
    expect(operations).toEqual(["clear-current", "set-current"]);
  });
});
