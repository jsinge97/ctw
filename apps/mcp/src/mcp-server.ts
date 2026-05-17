import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ApiInvoker } from "./api-invoker.js";
import { buildCtwToolDefinitions, toToolResult } from "./tools.js";

export function createCtwMcpServer(api: ApiInvoker) {
  const server = new McpServer({
    name: "ctw-mcp",
    version: "0.1.0"
  });

  for (const tool of buildCtwToolDefinitions()) {
    server.registerTool(tool.name, {
      annotations: tool.annotations,
      description: tool.description,
      inputSchema: tool.inputSchema,
      title: tool.title,
      ...(tool.operation ? { _meta: { "ctw/openapi": tool.operation } } : {})
    }, async (input) => toToolResult(await tool.handler(input as Record<string, unknown>, api)));
  }

  return server;
}
