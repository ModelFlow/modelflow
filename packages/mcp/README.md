# @modelflow/mcp

An [MCP](https://modelcontextprotocol.io) server that exposes the **ModelFlow
library** — a cited database of real-world objects and the behavioural models
they map onto — as tools an agent can call.

The point: when an agent needs to model something real (a solar panel, a home
battery, a rocket stage), it usually has to scrape numbers off datasheets and
Wikipedia and hope they're right. This server hands back the parameters directly
— each with its unit, a source citation, and a link — ready to wire into a
simulation.

## Tools

| Tool | Args | Returns |
| --- | --- | --- |
| `list_categories` | — | Object categories with counts + the available model types. Call this first. |
| `search_objects` | `query?`, `category?` | Compact list of matching objects. Multi-word queries are AND'd (`"home battery"` matches a residential battery). Omit both args for everything. |
| `get_object` | `id` | Full record for one object: every parameter with value, unit, `source`, `url`, and the model param it `mapsTo`. |
| `list_models` | — | Behavioural model types with their ports (units) and parameter names. |
| `get_model` | `type` | Full model spec: ports, dimensions, sourced parameter defaults, group ports, and step logic. |

Objects and models are linked: an object's `model` field names a model type, and
each mapped parameter's `mapsTo` names the model param its value can seed — so an
agent can go from "Tesla Powerwall 3" to a ready-to-run `Storage` instance.

## Run it

The server is TypeScript and imports the ModelFlow workspace packages, so it runs
under [Bun](https://bun.sh):

```sh
bun run packages/mcp/src/server.ts   # stdio transport; logs to stderr
```

## Configure a client

Point any MCP client at the server over stdio. Use an **absolute path** to
`server.ts`.

**Claude Code:**

```sh
claude mcp add modelflow -- bun run /ABSOLUTE/PATH/TO/modelflow/packages/mcp/src/server.ts
```

**Claude Desktop / generic MCP config** (`mcpServers` block):

```json
{
  "mcpServers": {
    "modelflow": {
      "command": "bun",
      "args": ["run", "/ABSOLUTE/PATH/TO/modelflow/packages/mcp/src/server.ts"]
    }
  }
}
```

## Smoke test

```sh
bun run packages/mcp/src/smoke.ts   # spawns the server and exercises every tool
```
