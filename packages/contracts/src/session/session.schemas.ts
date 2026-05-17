import { z } from "zod";
import { capabilities } from "@ctw/permissions";

export const sessionUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  displayName: z.string()
});

export const currentSessionSchema = z.object({
  user: sessionUserSchema,
  activeOrganization: z.object({ id: z.string(), name: z.string(), slug: z.string() }),
  membership: z.object({ id: z.string(), role: z.enum(["admin", "am", "va", "broker", "client"]) }),
  capabilities: z.array(z.enum(capabilities)),
  allowedSurfaces: z.array(z.string()),
  homeRoute: z.string()
});

export const acceptInvitationRequestSchema = z.object({
  token: z.string().min(1)
});

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const logoutResponseSchema = z.object({
  ok: z.literal(true)
});

export type CurrentSession = z.infer<typeof currentSessionSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
