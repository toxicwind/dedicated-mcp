/**
 * Pen module registry — manifest-driven, universal across ALL pens.
 *
 * Discovery reuses the exact contract `pens/toolkit/readme-gen.ts` uses
 * (`listPens`/`readProducts`): a pen is discoverable when it has a
 * `products.registry.json` (authoritative product list) or a `products/` dir.
 * Every discoverable pen gets a generic `<pen>/products.list` /
 * `<pen>/products.status` module, plus any bespoke typed factory, so the whole
 * estate is reachable through ONE dedicated-mcp endpoint — dynamically, never
 * hand-picked.
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { join } from 'node:path'
import type { ModuleRegistry } from '../registry.js'
import { registerFathom } from './fathom.js'
import { registerTrio } from './geode-trio.js'
import { registerEstate } from './estate.js'
import { registerBarn } from './barn.js'
import { registerForge } from './forge.js'

const PENS_ROOT = '/home/toxic/pens'
const SKIP_PENS: Record<string, boolean> = {
  estate: true, // control-plane: never a callable namespace
  pens: true, // coordinator superproject
  backups: true,
  archive: true,
  toolkit: true,
  wip: true,
  tmp: true,
}
const BESPOKE: Record<string, boolean> = { fathom: true, geode: true, estate: true, barn: true, forge: true }

export function listPens(root = PENS_ROOT): string[] {
  let top: string[] = []
  try {
    top = readdirSync(root)
  } catch {
    return []
  }
  const pens: string[] = []
  for (const name of top) {
    if (name.startsWith('.')) continue
    if (SKIP_PENS[name]) continue
    const p = join(root, name)
    try {
      if (!statSync(p).isDirectory()) continue
    } catch {
      continue
    }
    if (existsSync(join(p, 'products.registry.json')) || existsSync(join(p, 'products'))) pens.push(name)
  }
  return pens.sort()
}

export function readProducts(pen: string, root = PENS_ROOT): string[] {
  const regPath = join(root, pen, 'products.registry.json')
  const seen = new Set<string>()
  if (existsSync(regPath)) {
    try {
      const reg = JSON.parse(readFileSync(regPath, 'utf8')) as { products?: Record<string, { enabled?: boolean }> }
      for (const [name, info] of Object.entries(reg.products ?? {})) {
        if (name.startsWith('.')) continue // .github/.claude/.codex are not products
        if (info?.enabled === false) continue
        seen.add(name)
      }
    } catch {
      // malformed registry: fall through to the on-disk scan
    }
  }
  const prodDir = join(root, pen, 'products')
  if (existsSync(prodDir)) {
    try {
      for (const n of readdirSync(prodDir)) if (!n.startsWith('.')) seen.add(n)
    } catch {
      // unreadable products dir: ignore
    }
  }
  return [...seen].sort()
}

/**
 * Register the bespoke factories, then a generic module for EVERY other
 * discoverable pen (skip the five with typed factories so no namespace
 * double-registers). New pens with a manifest surface automatically.
 */
export function registerPenModules(registry: ModuleRegistry, pensRoot = PENS_ROOT): void {
  registerFathom(registry)
  registerTrio(registry)
  registerEstate(registry)
  registerBarn(registry)
  registerForge(registry)

  for (const pen of listPens(pensRoot)) {
    if (BESPOKE[pen]) continue
    registry.register({
      namespace: pen,
      description: `Generic ${pen} pen module — products + docs, discovered via manifest.`,
      tools: {
        'products.list': {
          description: `List the product repos of the ${pen} pen (manifest + on-disk union).`,
          handler: async () => {
            const products = readProducts(pen, pensRoot)
            return { content: [{ type: 'text', text: JSON.stringify({ pen, products }) }] }
          },
        },
        'products.status': {
          description: `Product count + docs existence for the ${pen} pen.`,
          handler: async () => {
            const products = readProducts(pen, pensRoot)
            const docs = existsSync(join(pensRoot, pen, 'docs'))
            return { content: [{ type: 'text', text: JSON.stringify({ pen, products: products.length, docs }) }] }
          },
        },
      },
    })
  }
}