/**
 * barn pen module — utility / estate-ops capability.
 *
 * Exposes the barn estate-ops script inventory (the ops tooling lane any pen
 * can call). Injectable root so unit tests drive a throwaway dir.
 */
import { existsSync, readdirSync } from 'node:fs'
import type { ModuleRegistry } from '../registry.js'

const SCRIPTS_ROOT = '/home/toxic/pens/barn/estate-ops/bin'

/** List non-hidden executable-looking entries under an ops bin root. */
export function listOpsScripts(path = SCRIPTS_ROOT): string[] {
	if (!existsSync(path)) return []
	return readdirSync(path, { withFileTypes: true })
		.filter((e) => e.isFile() && !e.name.startsWith('.'))
		.map((e) => e.name)
		.sort()
}

export function registerBarn(registry: ModuleRegistry): void {
	registry.register({
		namespace: 'barn',
		description: 'barn pen: estate-ops tooling surface',
		tools: {
			'scripts.list': {
				description: 'List the estate-ops scripts available under the barn bin root',
				handler: async () => ({ content: [{ type: 'text', text: JSON.stringify(listOpsScripts()) }] }),
			},
		},
	})
}
