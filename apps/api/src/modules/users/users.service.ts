import type { InviteUserRequest, UpdateUserRequest, UserDto } from "@ctw/contracts";
import { nextId, users } from "../demo-store.js";

export function listUsers(): UserDto[] {
  return users;
}

export function inviteUser(input: InviteUserRequest): UserDto {
  const user: UserDto = { id: nextId("user", users.length), name: input.name, email: input.email, role: input.role, status: "invited", lastLoginAt: null };
  users.push(user);
  return user;
}

export function updateUser(userId: string, input: UpdateUserRequest): UserDto {
  const user = users.find((item) => item.id === userId);
  if (!user) throw Object.assign(new Error("User not found"), { statusCode: 404 });
  Object.assign(user, input);
  return user;
}
