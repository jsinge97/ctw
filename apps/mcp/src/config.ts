export type McpConfig = {
  apiBaseUrl: string;
  apiToken: string;
  host: string;
  port: number;
};

export function loadMcpConfig(env: NodeJS.ProcessEnv = process.env): McpConfig {
  const apiToken = env.CTW_MCP_API_TOKEN ?? "am-token";
  const port = Number(env.CTW_MCP_PORT ?? 3010);
  if (!Number.isInteger(port) || port <= 0) throw new Error("CTW_MCP_PORT must be a positive integer");

  return {
    apiBaseUrl: env.CTW_MCP_API_BASE_URL ?? "http://127.0.0.1:3000",
    apiToken,
    host: env.CTW_MCP_HOST ?? "127.0.0.1",
    port
  };
}
