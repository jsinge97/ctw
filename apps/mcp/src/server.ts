import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { ApiInvoker } from "./api-invoker.js";
import { loadMcpConfig } from "./config.js";
import { createCtwMcpServer } from "./mcp-server.js";

const config = loadMcpConfig();
const app = createMcpExpressApp({ host: config.host });

app.get("/healthz", (_req, res) => {
  res.json({ ok: true });
});

app.post("/mcp", async (req, res) => {
  const server = createCtwMcpServer(new ApiInvoker({ baseUrl: config.apiBaseUrl, token: config.apiToken }));
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined } as unknown as ConstructorParameters<typeof StreamableHTTPServerTransport>[0]);
  try {
    await server.connect(transport as unknown as Parameters<typeof server.connect>[0]);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: error instanceof Error ? error.message : "Internal MCP server error" },
        id: null
      });
    }
  } finally {
    res.on("close", () => {
      void transport.close();
      void server.close();
    });
  }
});

app.get("/mcp", (_req, res) => {
  res.status(405).json({ jsonrpc: "2.0", error: { code: -32000, message: "Use POST /mcp for stateless Streamable HTTP." }, id: null });
});

app.delete("/mcp", (_req, res) => {
  res.status(405).json({ jsonrpc: "2.0", error: { code: -32000, message: "Session deletion is not used by this stateless MCP server." }, id: null });
});

app.listen(config.port, config.host, () => {
  console.log(`CTW MCP HTTP server listening on http://${config.host}:${config.port}/mcp`);
});
