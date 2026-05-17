import { z } from "zod";

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(["admin", "am", "va", "broker", "client"]),
  status: z.enum(["active", "invited", "disabled"]),
  lastLoginAt: z.string().nullable()
});
export const inviteUserRequestSchema = z.object({ email: z.string().email(), role: z.enum(["admin", "am", "va", "broker", "client"]), name: z.string().min(1) });
export const updateUserRequestSchema = z.object({ role: z.enum(["admin", "am", "va", "broker", "client"]).optional(), status: z.enum(["active", "disabled"]).optional() });
export type UserDto = z.infer<typeof userSchema>;
export type InviteUserRequest = z.infer<typeof inviteUserRequestSchema>;
export type UpdateUserRequest = z.infer<typeof updateUserRequestSchema>;
