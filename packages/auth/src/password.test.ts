import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password.js";

describe("password hashing", () => {
  it("verifies a scrypt password hash", () => {
    const passwordHash = hashPassword("correct horse battery staple", "test-salt");

    expect(verifyPassword("correct horse battery staple", passwordHash)).toBe(true);
    expect(verifyPassword("wrong password", passwordHash)).toBe(false);
  });

  it("rejects unsupported hash formats", () => {
    expect(verifyPassword("password", "plaintext")).toBe(false);
  });
});
