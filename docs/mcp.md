# CTW MCP Server

Working draft, May 17, 2026.

The CTW MCP server exposes safe, typed workflow tools over HTTP.

- Package: `apps/mcp`
- Local endpoint: `http://127.0.0.1:3010/mcp`
- Transport: MCP Streamable HTTP, stateless mode
- API source of truth: `packages/api-client/src/generated/openapi.json`

## Design

The MCP server does not hand-roll a second API client for every tool. Each tool descriptor points at an OpenAPI method/path pair, and execution goes through a generic OpenAPI invoker:

1. Tool input is validated by a Zod schema.
2. The tool descriptor names the OpenAPI operation it adapts.
3. The generic invoker verifies the operation exists in the generated OpenAPI document.
4. The invoker fills path params, sends JSON, and authenticates to the CTW API with a bearer token.
5. The MCP response includes both text content and structured content.

Adding a new MCP tool should usually be:

1. Add or update the API route/contract.
2. Run `pnpm openapi:generate && pnpm client:generate`.
3. Add a curated descriptor in `apps/mcp/src/tools.ts`.
4. Add a focused test.

## Tools

- `ctw_list_openapi_operations`
- `ctw_list_deals`
- `ctw_get_deal_workspace`
- `ctw_create_deal`
- `ctw_move_deal_stage`
- `ctw_create_task`
- `ctw_decide_task`
- `ctw_list_routing_review`
- `ctw_resolve_routing_review`
- `ctw_list_va_work`
- `ctw_update_va_work`

The list is curated on purpose. MCP should expose product workflow actions, not every internal endpoint by default.

## Local Run

Start the API first:

```bash
CTW_RUNTIME_MODE=demo CTW_DB_MODE=memory CTW_JOBS_MODE=memory CTW_PROVIDER_MODE=fake CTW_STORAGE_MODE=memory CTW_ALLOW_DEMO_TOKENS=false pnpm --filter @ctw/api start
```

Then start MCP:

```bash
CTW_MCP_API_BASE_URL=http://127.0.0.1:3000 CTW_MCP_API_TOKEN=am-token pnpm --filter @ctw/mcp dev
```

Use `CTW_MCP_API_TOKEN` to decide which role/capability set the MCP server uses when calling the CTW API.

Demo tokens:

- `admin-token`
- `am-token`
- `broker-token`
- `client-token`
- `va-token`

## Verification

```bash
pnpm --filter @ctw/mcp typecheck
pnpm --filter @ctw/mcp test
pnpm --filter @ctw/mcp build
```
