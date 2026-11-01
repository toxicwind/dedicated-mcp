/**
 * Universal module registry for dedicated-mcp.
 *
 * ANY pen capability can be registered as a `Module` here — one namespace,
 * any number of tools. The MCP server exposes every tool as
 * `<namespace>/<name>` so no two pens ever collide and the whole estate is
 * reachable through ONE endpoint (dedicated.mildlyawesome.com).
 */
import type { Tool } from '@modelcontextprotocol/sdk/types.js'

export interface ModuleContext {
  /** Root of the pen the module belongs to (absolute path). */
  penRoot: string
  /** Fetcher for live registry state — modules are discovered at runtime. */
  env: Record<string, string | undefined>
}

export type ToolHandler = (
  args: Record<string, unknown>,
  ctx: ModuleContext,
) => Promise<{ content: Array<{ type: 'text'; text: string }> }>

export interface ModuleSpec {
  /** Pen-scoped namespace, e.g. 'fathom', 'estate', 'geode'. */
  namespace: string
  description: string
  tools: Record<string, { description: string; handler: ToolHandler }>
}

export class ModuleRegistry {
  private modules = new Map<string, ModuleSpec>()

  register(spec: ModuleSpec): void {
    if (this.modules.has(spec.namespace)) {
      throw new Error(`module already registered: ${spec.namespace}`)
    }
    this.modules.set(spec.namespace, spec)
  }

  namespaces(): string[] {
    return [...this.modules.keys()]
  }

  /** All tools flattened to MCP `Tool` schema with `<ns>/<name>` names. */
  listTools(): Tool[] {
    const out: Tool[] = []
    for (const mod of this.modules.values()) {
      for (const name of Object.keys(mod.tools)) {
        const tool = mod.tools[name]
        if (!tool) continue
        out.push({
          name: `${mod.namespace}/${name}`,
          description: `${mod.namespace}: ${tool.description}`,
          inputSchema: { type: 'object', properties: {}, additionalProperties: true },
        })
      }
    }
    return out
  }

  async call(
    fullName: string,
    args: Record<string, unknown>,
    ctx: ModuleContext,
  ): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
    const slash = fullName.indexOf('/')
    if (slash < 1) throw new Error(`malformed tool name: ${fullName}`)
    const ns = fullName.slice(0, slash)
    const name = fullName.slice(slash + 1)
    const mod = this.modules.get(ns)
    if (!mod) throw new Error(`unknown module: ${ns}`)
    const tool = mod.tools[name]
    if (!tool) throw new Error(`unknown tool ${ns}/${name}`)
    return tool.handler(args, ctx)
  }
}