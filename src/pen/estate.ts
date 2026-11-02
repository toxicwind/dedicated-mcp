/**
 * estate pen module — universal control-plane ops.
 *
 * Exposes the estate SSOT surfaces any environment needs: the live
 * ports-registry (pens/estate/config/ports.env — the numeric Port SSOT that
 * every daemon binds) and the pen inventory. Read-only, data-framed.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import type { ModuleRegistry } from '../registry.js'

const PORTS_ENV = '/home/toxic/pens/estate/config/ports.env'
const PENS_ROOT = '/home/toxic/pens'

/** Parse the ports.env format (KEY=PORT[# comment]) into a key->value map. */
export function parsePorts(text: string): Record<string, string | number> {
	const out: Record<string, string | number> = {}
	for (const raw of text.split('\n')) {
		const line = raw.trim()
		if (!line || line.startsWith('#')) continue
		const eq = line.indexOf('=')
		if (eq < 1) continue
		const key = line.slice(0, eq).trim()
		// Strip an inline `# comment` so trailing annotations don't defeat the numeric test.
		const val = line.slice(eq + 1).split('#')[0]!.trim()
		if (/^\d+$/.test(val)) out[key] = Number(val)
	}
	return out
}

export function loadPorts(path = PORTS_ENV): Record<string, string | number> {
	if (!existsSync(path)) return { error: 'ports.env missing' }
	return parsePorts(readFileSync(path, 'utf8'))
}

export function loadPens(path = PENS_ROOT): Array<{ pen: string; products: number; docs: boolean }> {
  if (!existsSync(path)) return []
  const pens: Array<{ pen: string; products: number; docs: boolean }> = []
  for (const pen of readdirSync(path, { withFileTypes: true })) {
    if (!pen.isDirectory() || pen.name.startsWith('.')) continue
    const penDir = `${path}/${pen.name}`
    let products = 0
    const prods = `${penDir}/products`
    if (existsSync(prods)) {
      products = readdirSync(prods, { withFileTypes: true }).filter((p) => p.isDirectory() && !p.name.startsWith('.')).length
    }
    pens.push({ pen: pen.name, products, docs: existsSync(`${penDir}/docs`) })
  }
  return pens.sort((a, b) => a.pen.localeCompare(b.pen))
}

export function registerEstate(registry: ModuleRegistry): void {
  registry.register({
    namespace: 'estate',
    description: 'estate pen: ports SSOT + pen inventory (control-plane ops)',
    tools: {
      'ports.list': {
        description: 'Return the estate Port SSOT (pens/estate/config/ports.env) as key->port JSON',
        handler: async () => {
          return { content: [{ type: 'text', text: JSON.stringify(loadPorts()) }] }
        },
      },
      'ports.lookup': {
        description: 'Look up the port for a service key (e.g. ports.lookup key=THRESHER_PORT)',
        handler: async (args) => {
          const key = String(args.key ?? '').toUpperCase()
          const ports = loadPorts()
          const val = ports[key]
          return { content: [{ type: 'text', text: val === undefined ? `${key}=<unset>` : `${key}=${val}` }] }
        },
      },
      'pens.list': {
        description: 'Enumerate all pens with product count + whether docs/ exists',
        handler: async () => {
          return { content: [{ type: 'text', text: JSON.stringify(loadPens()) }] }
        },
      },
    },
  })
}
