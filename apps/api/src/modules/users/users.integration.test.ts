import { describe, expect, it } from "vitest";
import { inviteUser } from "./users.service.js";

describe("users service", () => {
  it("invites users", async () => {
    await expect(inviteUser({ email: "new@example.com", name: "New User", role: "client" })).resolves.toMatchObject({ status: "invited" });
  });
});
