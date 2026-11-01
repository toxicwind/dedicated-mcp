/**
 * Pen module registry — ONE import per pen. Adding a capability is one file in
 * here + this line; the server auto-exposes it as `<namespace>/<tool>`.
 *
 * This is the universal, modular seam: any pen (fathom, geode, estate, barn,
 * forge, ...) registers a module and the whole estate is reachable through the
 * single dedicated-mcp endpoint (dedicated.mildlyawesome.com).
 */
import type { ModuleRegistry } from '../registry.js'
import { registerFathom } from './fathom.js'
import { registerTrio } from './geode-trio.js'

/**
 * Register every pen module — add one line per pen here. The server exposes all
 * of them as `<namespace>/<tool>` with no further wiring.
 */
export function registerPenModules(registry: ModuleRegistry): void {
  registerFathom(registry)
  registerTrio(registry)
}