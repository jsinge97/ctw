import { afterEach, describe, expect, it } from "vitest";
import { sessionCookieHeader } from "@ctw/auth";
import { buildServer } from "../server.js";
import { participants } from "./demo-store.js";
import { resetDurableSessionLookupForTests, resolveSessionFromToken, setDurableSessionLookupForTests } from "./session/session.service.js";
import { listVaWork } from "./va-work/va-work.service.js";

afterEach(() => {
  resetDurableSessionLookupForTests();
});

describe("route authorization", () => {
  it("lets broker participants see only their permitted deals", async () => {
    const app = await buildServer();
    const response = await app.inject({ method: "GET", url: "/v1/deals", headers: { authorization: "Bearer broker-token" } });
    const otherBroker = await app.inject({ method: "GET", url: "/v1/deals", headers: { authorization: "Bearer broker-2-token" } });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(expect.arrayContaining([expect.objectContaining({ id: "deal_sutter" })]));
    expect(response.json()).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: "deal_bryant" })]));
    expect(otherBroker.statusCode).toBe(403);
  });

  it("applies participant authorization to Better Auth cookie sessions", async () => {
    setDurableSessionLookupForTests(async (token) =>
      token === "seed-session-broker"
        ? {
            userId: "user_broker",
            email: "broker@halcyon.com",
            displayName: "Devon Asherton",
            organizationId: "org_northgate",
            organizationName: "Northgate CRE",
            organizationSlug: "northgate",
            membershipId: "mem_broker",
            role: "broker"
          }
        : null
    );

    const app = await buildServer();
    const response = await app.inject({ method: "GET", url: "/v1/deals", headers: { cookie: sessionCookieHeader("seed-session-broker") } });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(expect.arrayContaining([expect.objectContaining({ id: "deal_sutter" })]));
    expect(response.json()).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: "deal_bryant" })]));
  });

  it("lets VAs execute assigned queue work without granting admin review actions", async () => {
    const app = await buildServer();
    const [item] = await listVaWork(resolveSessionFromToken("va-token"));
    if (!item) throw new Error("missing VA item");

    const started = await app.inject({ method: "POST", url: `/v1/va-work-items/${item.id}/start`, headers: { authorization: "Bearer va-token" }, payload: { notes: "Starting" } });
    const accepted = await app.inject({ method: "POST", url: `/v1/va-work-items/${item.id}/accept`, headers: { authorization: "Bearer va-token" }, payload: { notes: "Done" } });

    expect(started.statusCode).toBe(200);
    expect(accepted.statusCode).toBe(403);
  });

  it("applies participant grants to task decision routes that do not include deal IDs", async () => {
    const participant = participants.find((item) => item.id === "part_devon");
    if (!participant) throw new Error("missing broker participant");
    const originalCapabilities = participant.capabilities;
    participant.capabilities = [...originalCapabilities, "editTask"];

    try {
      const app = await buildServer();
      const response = await app.inject({ method: "POST", url: "/v1/tasks/task_next/defer", headers: { authorization: "Bearer broker-token" }, payload: { reason: "Broker requested a pause" } });

      expect(response.statusCode).toBe(200);
    } finally {
      participant.capabilities = originalCapabilities;
    }
  });
});
