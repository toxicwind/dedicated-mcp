/**
 * dedicated-mcp — a UNIVERSAL modular MCP server for the whole estate.
 *
 * Every pen capability registers as a `Module` (see registry.ts). Each module
 * contributes tools, namespaced `<namespace>/<name>` so no two pens collide and
 * the whole estate is reachable through ONE endpoint
 * (dedicated.mildlyawesome.com). No hardcoded pen list: `registerModule()` is
 * the universal seam any product/skill can use.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { ModuleRegistry } from './registry.js'
import type { ModuleContext } from './registry.js'
import { registerPenModules } from './pen/index.js'

const registry = new ModuleRegistry()

// The universal register seam — a module per pen/capability. Modules are added
// here; the server picks them all up with no further wiring.
registerPenModules(registry)

const defaultCtx: ModuleContext = {
  penRoot: process.cwd(),
  env: process.env,
}

const server = new Server(
  { name: 'dedicated-mcp', version: '0.1.0' },
  { capabilities: { tools: {} } },
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: registry.listTools(),
}))

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const tools = registry.listTools()
  const names = tools.map((t) => t.name)
  const hit = names.find((n) => n === req.params.name)
  if (!hit) {
    return {
      content: [{ type: 'text', text: `unknown tool: ${req.params.name}` }],
      isError: true,
    }
  }
  try {
    const result = await registry.call(req.params.name, req.params.arguments ?? {}, defaultCtx)
    return {
      content: result.content,
      isError: false,
    }
  } catch (err) {
    return { content: [{ type: 'text', text: `error: ${String(err)}` }], isError: true }
  }
})

await server.connect(new StdioServerTransport())