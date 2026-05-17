import type { CurrentSession, InviteUserRequest, UpdateUserRequest, UserDto } from "@ctw/contracts";
import { getWorkflowProvider } from "../workflow-provider.js";

export async function listUsers(session?: CurrentSession): Promise<UserDto[]> {
  const workflow = getWorkflowProvider();
  if (workflow.mode === "prisma" && workflow.prisma) return workflow.prisma.listUsers(session?.activeOrganization.id ?? "org_northgate") as Promise<UserDto[]>;
  return workflow.memory.users;
}

export async function inviteUser(input: InviteUserRequest, session?: CurrentSession): Promise<UserDto> {
  const workflow = getWorkflowProvider();
  if (workflow.mode === "prisma" && workflow.prisma) return workflow.prisma.inviteUser({ organizationId: session?.activeOrganization.id ?? "org_northgate", ...input }) as Promise<UserDto>;
  const user: UserDto = { id: workflow.memory.nextId("user", workflow.memory.users.length), name: input.name, email: input.email, role: input.role, status: "invited", lastLoginAt: null };
  workflow.memory.users.push(user);
  return user;
}

export async function updateUser(userId: string, input: UpdateUserRequest, session?: CurrentSession): Promise<UserDto> {
  const workflow = getWorkflowProvider();
  if (workflow.mode === "prisma" && workflow.prisma) {
    const patch: { organizationId: string; userId: string; role?: "admin" | "am" | "va" | "broker" | "client"; status?: "active" | "disabled" } = { organizationId: session?.activeOrganization.id ?? "org_northgate", userId };
    if (input.role !== undefined) patch.role = input.role;
    if (input.status !== undefined) patch.status = input.status;
    return workflow.prisma.updateUser(patch) as Promise<UserDto>;
  }
  const user = workflow.memory.users.find((item) => item.id === userId);
  if (!user) throw Object.assign(new Error("User not found"), { statusCode: 404 });
  Object.assign(user, input);
  return user;
}

export async function resendInvitation(userId: string, session?: CurrentSession): Promise<UserDto> {
  const workflow = getWorkflowProvider();
  if (workflow.mode === "prisma" && workflow.prisma) return workflow.prisma.resendUserInvitation({ organizationId: session?.activeOrganization.id ?? "org_northgate", userId }) as Promise<UserDto>;
  const user = workflow.memory.users.find((item) => item.id === userId);
  if (!user) throw Object.assign(new Error("User not found"), { statusCode: 404 });
  return user;
}
