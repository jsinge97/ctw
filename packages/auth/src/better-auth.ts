export type BetterAuthConfig = {
  appBaseUrl: string;
  secret: string;
};

export function configureBetterAuth(config: BetterAuthConfig) {
  return {
    kind: "better-auth",
    appBaseUrl: config.appBaseUrl,
    hasSecret: config.secret.length > 0
  };
}
