import { describe, expect, it } from "vitest";
import { buildServer } from "../server.js";
import { resolveSessionFromToken } from "./session/session.service.js";
import { listVaWork } from "./va-work/va-work.service.js";

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

  it("lets VAs execute assigned queue work without granting admin review actions", async () => {
    const app = await buildServer();
    const [item] = listVaWork(resolveSessionFromToken("va-token"));
    if (!item) throw new Error("missing VA item");

    const started = await app.inject({ method: "POST", url: `/v1/va-work-items/${item.id}/start`, headers: { authorization: "Bearer va-token" }, payload: { notes: "Starting" } });
    const accepted = await app.inject({ method: "POST", url: `/v1/va-work-items/${item.id}/accept`, headers: { authorization: "Bearer va-token" }, payload: { notes: "Done" } });

    expect(started.statusCode).toBe(200);
    expect(accepted.statusCode).toBe(403);
  });
});
