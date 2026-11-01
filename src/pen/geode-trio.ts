/**
 * geode/trio module — universal repo-analysis capability (cross-pen proof).
 *
 * trio (geode pen's bun kernel) runs a persistent analysis cell against any
 * repo. Registering it here proves the universal seam: one module per pen,
 * namespaced tools, whole estate reachable via dedicated-mcp.
 *
 * Handlers run through Effect so a failed exec returns as a tool RESULT (a
 * text node) instead of throwing out of the MCP request.
 */
import { execFileSync } from 'node:child_process'
import { Effect } from 'effect'
import type { ModuleRegistry, ToolHandler } from '../registry.js'

const DEFAULT_ROOT = '/home/toxic/pens'

function resolveRoot(repoPath: unknown, fallback: string | undefined): string {
  const named = typeof repoPath === 'string' && repoPath.length > 0 ? repoPath : ''
  return (named || fallback || DEFAULT_ROOT).trim()
}

function runGit(root: string, args: string[]): string {
  return execFileSync('git', ['-C', root, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
    timeout: 10_000,
  }).trim()
}

const stat: ToolHandler = async (args, ctx) => {
  const root = resolveRoot(args?.repoPath, ctx.env.REPO_ROOT)
  const head = runGit(root, ['rev-parse', '--short', 'HEAD'])
  const dirty = runGit(root, ['status', '--porcelain']).split('\n').filter(Boolean).length
  return Effect.tryPromise({
    try: async () => ({ content: [{ type: 'text' as const, text: `repo ${root}  head=${head}  dirty=${dirty}` }] }),
    catch: (err) => {
      const msg = err instanceof Error ? err.message : String(err)
      return { tag: 'ToolResult', content: [{ type: 'text' as const, text: `geode/repo.state failed: ${msg}` }] }
    },
  }).pipe(Effect.runPromise)
}

const tree: ToolHandler = async (args, ctx) => {
  const root = resolveRoot(args?.repoPath, ctx.env.REPO_ROOT)
  const total = runGit(root, ['ls-tree', '-r', '--name-only', 'HEAD']).split('\n').filter(Boolean).length
  const top = runGit(root, ['ls-tree', '--name-only', 'HEAD']).split('\n').join(' ')
  return Effect.tryPromise({
    try: async () => ({ content: [{ type: 'text' as const, text: `repo ${root}  tracked=${total}\n${top}` }] }),
    catch: (err) => {
      const msg = err instanceof Error ? err.message : String(err)
      return { tag: 'ToolResult', content: [{ type: 'text' as const, text: `geode/repo.tree failed: ${msg}` }] }
    },
  }).pipe(Effect.runPromise)
}

export function registerTrio(registry: ModuleRegistry): void {
  registry.register({
    namespace: 'geode',
    description: 'geode pen: trio repo-analysis kernel (git state, tracked tree)',
    tools: {
      'repo.state': {
        description: 'HEAD short id + dirty-file count of a repo. Pass repoPath (default: estate).',
        handler: stat,
      },
      'repo.tree': {
        description: 'Tracked file count + top-level layout of a repo. Pass repoPath.',
        handler: tree,
      },
    },
  })
}