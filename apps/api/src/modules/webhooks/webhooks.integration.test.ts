import { describe, expect, it } from "vitest";
import { buildServer } from "../../server.js";

describe("webhooks", () => {
  it("accepts resend inbound payloads", async () => {
    const app = await buildServer();
    const response = await app.inject({ method: "POST", url: "/v1/webhooks/resend", payload: { from: "a@example.com", to: "deals@example.com", text: "Hello", attachments: [{ filename: "tour.pdf", contentType: "application/pdf", contentBase64: "SGVsbG8=" }] } });
    expect(response.statusCode).toBe(200);
    expect(response.json().accepted).toBe(true);
  });
});
