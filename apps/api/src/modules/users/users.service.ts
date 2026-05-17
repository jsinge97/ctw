import type { InviteUserRequest, UpdateUserRequest, UserDto } from "@ctw/contracts";
import { getWorkflowProvider } from "../workflow-provider.js";

const workflow = getWorkflowProvider().memory;

export function listUsers(): UserDto[] {
  return workflow.users;
}

export function inviteUser(input: InviteUserRequest): UserDto {
  const user: UserDto = { id: workflow.nextId("user", workflow.users.length), name: input.name, email: input.email, role: input.role, status: "invited", lastLoginAt: null };
  workflow.users.push(user);
  return user;
}

export function updateUser(userId: string, input: UpdateUserRequest): UserDto {
  const user = workflow.users.find((item) => item.id === userId);
  if (!user) throw Object.assign(new Error("User not found"), { statusCode: 404 });
  Object.assign(user, input);
  return user;
}
