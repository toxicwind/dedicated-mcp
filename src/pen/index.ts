/**
 * Pen module registry — ONE import per pen. Comment in a pen file to add its
 * capability; the server auto-exposes it. This is the universal, modular
 * seam: fathom is an example; add estate.ts, geode.ts, forge.ts the same way.
 */
import type { ModuleRegistry } from '../registry.js'
import { registerFathom } from './fathom.js'

export function registerPenModules(registry: ModuleRegistry): void {
  registerFathom(registry)
  // registerEstate(registry)
  // registerGeode(registry)
  // registerForge(registry)
}