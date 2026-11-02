/**
 * toolkit module — exposes the fabric's shared-environment traces as tools:
 * the fabric.json service catalog and the conventional ports.json (both minted
 * by pens/toolkit gen-fabric.ts / gen-ports.ts). This is the "toolkit-mcp"
 * surface federated through dedicated-mcp — the controllable, non-fatal edge.
 */
import { readFileSync } from 'node:fs'
import type { ModuleRegistry } from '../registry.js'

const FABRIC = '/home/toxic/pens/toolkit/fabric.json'
const PORTS = '/home/toxic/pens/toolkit/ports.json'

export function registerToolkit(registry: ModuleRegistry): void {
  registry.register({
    namespace: 'toolkit',
    description: 'toolkit (pens/toolkit) fabric traces — fabric.json service catalog + conventional ports.json',
    tools: {
      'fabric.read': {
        description: "Read the fabric.json service catalog (all pens' products with live git HEAD + dirty).",
        handler: async () => ({
          content: [{ type: 'text', text: JSON.stringify(JSON.parse(readFileSync(FABRIC, 'utf8'))) }],
        }),
      },
      'ports.list': {
        description: 'Read the conventional ports.json registry (product-keyed, aliases + owner).',
        handler: async () => ({
          content: [{ type: 'text', text: JSON.stringify(JSON.parse(readFileSync(PORTS, 'utf8'))) }],
        }),
      },
      'fabric.pen': {
        description: "Read one pen's products from fabric.json. Pass pen (e.g. \"fathom\").",
        handler: async (args) => {
          const pen = String(args.pen ?? '')
          const fabric = JSON.parse(readFileSync(FABRIC, 'utf8')) as { pens: Array<{ pen: string; products: unknown[] }> }
          const entry = fabric.pens.find((p) => p.pen === pen)
          return { content: [{ type: 'text', text: JSON.stringify(entry ?? { pen, products: [] }) }] }
        },
      },
    },
  })
}
