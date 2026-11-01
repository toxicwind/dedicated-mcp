/**
 * fathom pen module — example of the universal per-pen seam.
 *
 * Registers fathom's strudel sample-bank capability as a module. THIS file is
 * the template: any pen (estate, geode, forge, ...) adds `src/pen/<pen>.ts`
 * that calls `registry.register()` and imports it from `src/pen/index.ts`.
 */
import type { ModuleRegistry } from '../registry.js'

export function registerFathom(registry: ModuleRegistry): void {
  registry.register({
    namespace: 'fathom',
    description: 'fathom pen: strudel workbench + sampler banks (deep-water music)',
    tools: {
      'sampler.banks': {
        description: 'List the strudel sampler banks currently served on :55432',
        handler: async () => {
          let banks: Record<string, number>
          try {
            const res = await fetch('http://localhost:55432/')
            const map = (await res.json()) as Record<string, string[]>
            banks = Object.fromEntries(Object.entries(map).map(([b, v]) => [b, Array.isArray(v) ? v.length : 0]))
          } catch {
            banks = { error: -1 }
          }
          return { content: [{ type: 'text', text: JSON.stringify(banks) }] }
        },
      },
      'strudel.eval': {
        description: 'Validate strudel pattern code (mini-notation syntax sanity)',
        handler: async (args) => {
          const code = String(args.code ?? '')
          const ok = /[a-z]+\(.*\)/.test(code) || /\bh([0-9]+ )/.test(code)
          return { content: [{ type: 'text', text: `valid:${ok} len:${code.length}` }] }
        },
      },
    },
  })
}