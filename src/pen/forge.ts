/**
 * forge pen module — operator / product line capability.
 *
 * Exposes the forge products inventory (the operators lane). Injectable root
 * for unit tests.
 */
import { existsSync, readdirSync } from 'node:fs'
import type { ModuleRegistry } from '../registry.js'

const FORGE_ROOT = '/home/toxic/pens/forge/products'

/** Enumerate forge product subdirectories under an injectable root. */
export function listForgeProducts(path = FORGE_ROOT): string[] {
	if (!existsSync(path)) return []
	return readdirSync(path, { withFileTypes: true })
		.filter((e) => e.isDirectory() && !e.name.startsWith('.'))
		.map((e) => e.name)
		.sort()
}

export function registerForge(registry: ModuleRegistry): void {
	registry.register({
		namespace: 'forge',
		description: 'forge pen: operator / product-line surface',
		tools: {
			'products.list': {
				description: 'List the forge product directories under the forge products root',
				handler: async () => ({ content: [{ type: 'text', text: JSON.stringify(listForgeProducts()) }] }),
			},
		},
	})
}
