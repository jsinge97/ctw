import { BETTER_AUTH_SESSION_COOKIE } from "./session.js";

export type BetterAuthConfig = {
  appBaseUrl: string;
  secret: string;
};

export function configureBetterAuth(config: BetterAuthConfig) {
  return {
    kind: "better-auth",
    appBaseUrl: config.appBaseUrl,
    sessionCookieName: BETTER_AUTH_SESSION_COOKIE,
    hasSecret: config.secret.length > 0
  };
}
