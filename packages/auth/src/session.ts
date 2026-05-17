import type { Role } from "@ctw/permissions";

export const BETTER_AUTH_SESSION_COOKIE = "better-auth.session_token";

export type DurableSessionLookup = {
  userId: string;
  email: string;
  displayName: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  membershipId: string;
  role: Role;
};

type AuthSessionRecord = {
  expiresAt: Date;
  user: {
    id: string;
    email: string;
    displayName: string;
    memberships: Array<{
      id: string;
      organizationId: string;
      role: Role;
      status: "invited" | "active" | "disabled";
    }>;
  };
  activeOrganization: {
    id: string;
    name: string;
    slug: string;
  };
};

export type AuthSessionReader = {
  authSession: {
    findUnique: (args: {
      where: { token: string };
      include: {
        user: { include: { memberships: true } };
        activeOrganization: true;
      };
    }) => Promise<AuthSessionRecord | null>;
  };
};

export function sessionTokenFromCookieHeader(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
  for (const cookie of cookies) {
    const [name, ...valueParts] = cookie.split("=");
    if (name === BETTER_AUTH_SESSION_COOKIE) return decodeURIComponent(valueParts.join("="));
  }
  return null;
}

export function sessionCookieHeader(token: string): string {
  return `${BETTER_AUTH_SESSION_COOKIE}=${encodeURIComponent(token)}`;
}

export type SessionCookieOptions = {
  sameSite?: "lax" | "strict" | "none";
  secure?: boolean;
};

export function sessionSetCookieHeader(token: string, maxAgeSeconds = 60 * 60 * 24 * 30, options: SessionCookieOptions = {}): string {
  return `${sessionCookieHeader(token)}; Path=/; HttpOnly; SameSite=${formatSameSite(options.sameSite)}${options.secure ? "; Secure" : ""}; Max-Age=${maxAgeSeconds}`;
}

export function sessionClearCookieHeader(options: SessionCookieOptions = {}): string {
  return `${BETTER_AUTH_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=${formatSameSite(options.sameSite)}${options.secure ? "; Secure" : ""}; Max-Age=0`;
}

function formatSameSite(value: SessionCookieOptions["sameSite"]): "Lax" | "Strict" | "None" {
  if (value === "strict") return "Strict";
  if (value === "none") return "None";
  return "Lax";
}

export async function lookupBetterAuthSession(prisma: AuthSessionReader, token: string, now = new Date()): Promise<DurableSessionLookup | null> {
  const session = await prisma.authSession.findUnique({
    where: { token },
    include: {
      user: { include: { memberships: true } },
      activeOrganization: true
    }
  });
  if (!session || session.expiresAt <= now) return null;

  const membership = session.user.memberships.find((item) => item.organizationId === session.activeOrganization.id && item.status === "active");
  if (!membership) return null;

  return {
    userId: session.user.id,
    email: session.user.email,
    displayName: session.user.displayName,
    organizationId: session.activeOrganization.id,
    organizationName: session.activeOrganization.name,
    organizationSlug: session.activeOrganization.slug,
    membershipId: membership.id,
    role: membership.role
  };
}
