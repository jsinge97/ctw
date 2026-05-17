import { describe, expect, it } from "vitest";
import { buildServer } from "../../server.js";

describe("deals API", () => {
  it("lists and moves deals", async () => {
    const app = await buildServer();
    const headers = { authorization: "Bearer am-token" };
    const list = await app.inject({ method: "GET", url: "/v1/deals", headers });
    expect(list.statusCode).toBe(200);
    const [deal] = list.json();
    const moved = await app.inject({ method: "POST", url: `/v1/deals/${deal.id}/move-stage`, headers, payload: { stage: "negotiation" } });
    expect(moved.statusCode).toBe(200);
    expect(moved.json().stage).toBe("negotiation");
  });
});
