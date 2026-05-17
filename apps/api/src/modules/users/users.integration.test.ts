import { describe, expect, it } from "vitest";
import { inviteUser } from "./users.service.js";

describe("users service", () => {
  it("invites users", () => {
    expect(inviteUser({ email: "new@example.com", name: "New User", role: "client" }).status).toBe("invited");
  });
});
