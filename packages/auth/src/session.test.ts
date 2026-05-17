import { describe, expect, it } from "vitest";
import { lookupBetterAuthSession, sessionCookieHeader, sessionTokenFromCookieHeader, type AuthSessionReader } from "./session.js";

describe("Better Auth session helpers", () => {
  it("reads the Better Auth session token cookie", () => {
    expect(sessionTokenFromCookieHeader(`theme=dark; ${sessionCookieHeader("seed-session-am")}; other=value`)).toBe("seed-session-am");
  });

  it("resolves an active durable session into app session lookup data", async () => {
    const prisma: AuthSessionReader = {
      authSession: {
        async findUnique() {
          return {
            expiresAt: new Date("2026-06-17T00:00:00.000Z"),
            user: {
              id: "user_am",
              email: "am@northgate.cre",
              displayName: "Maria Reyes",
              memberships: [{ id: "mem_am", organizationId: "org_northgate", role: "am", status: "active" }]
            },
            activeOrganization: { id: "org_northgate", name: "Northgate CRE", slug: "northgate" }
          };
        }
      }
    };

    await expect(lookupBetterAuthSession(prisma, "seed-session-am", new Date("2026-05-17T00:00:00.000Z"))).resolves.toMatchObject({
      userId: "user_am",
      membershipId: "mem_am",
      role: "am"
    });
  });

  it("rejects expired sessions and users without an active membership", async () => {
    const expired: AuthSessionReader = {
      authSession: {
        async findUnique() {
          return {
            expiresAt: new Date("2026-05-01T00:00:00.000Z"),
            user: { id: "user_am", email: "am@northgate.cre", displayName: "Maria Reyes", memberships: [] },
            activeOrganization: { id: "org_northgate", name: "Northgate CRE", slug: "northgate" }
          };
        }
      }
    };

    await expect(lookupBetterAuthSession(expired, "seed-session-am", new Date("2026-05-17T00:00:00.000Z"))).resolves.toBeNull();
  });
});
