import { describe, expect, test } from "bun:test";
import { ModuleRegistry, type ModuleContext, type ModuleSpec } from "../src/registry";

const defaultCtx: ModuleContext = { penRoot: "/pens/fathom", env: {} };

function spec(namespace: string, tools: ModuleSpec["tools"]): ModuleSpec {
	return { namespace, description: `${namespace} module`, tools };
}

describe("ModuleRegistry.register", () => {
	test("registers a new namespace and it appears in namespaces()", () => {
		const r = new ModuleRegistry();
		r.register(spec("fathom", { "sampler.banks": { description: "list banks", handler: async () => ({ content: [{ type: "text", text: "[]" }] }) } }));
		expect(r.namespaces()).toEqual(["fathom"]);
	});

	test("throws on duplicate namespace", () => {
		const r = new ModuleRegistry();
		r.register(spec("estate", {}));
		expect(() => r.register(spec("estate", {}))).toThrow(/already registered: estate/);
	});

	test("registers multiple distinct namespaces", () => {
		const r = new ModuleRegistry();
		r.register(spec("fathom", {}));
		r.register(spec("geode", {}));
		r.register(spec("estate", {}));
		expect(r.namespaces().sort()).toEqual(["estate", "fathom", "geode"]);
	});

	test("empty namespace is registrable (no tools)", () => {
		const r = new ModuleRegistry();
		r.register(spec("empty", {}));
		expect(r.namespaces()).toEqual(["empty"]);
	});
});

describe("ModuleRegistry.listTools", () => {
	test("flattens every module tool to ns/name with prefixed description", () => {
		const r = new ModuleRegistry();
		r.register(
			spec("fathom", {
				"sampler.banks": { description: "list banks", handler: async () => ({ content: [{ type: "text", text: "" }] }) },
			}),
		);
		r.register(
			spec("geode", {
				"repo.state": { description: "repo head", handler: async () => ({ content: [{ type: "text", text: "" }] }) },
				"repo.tree": { description: "repo tree", handler: async () => ({ content: [{ type: "text", text: "" }] }) },
			}),
		);
		const tools = r.listTools();
		expect(tools.map(t => t.name).sort()).toEqual(["fathom/sampler.banks", "geode/repo.state", "geode/repo.tree"]);
		const state = tools.find(t => t.name === "geode/repo.state")!;
		expect(state.description).toBe("geode: repo head");
		expect(state.inputSchema).toMatchObject({ type: "object" });
	});

	test("returns empty array with no modules", () => {
		expect(new ModuleRegistry().listTools()).toEqual([]);
	});

	test("handles two tools with the same unqualified name in different namespaces", () => {
		const r = new ModuleRegistry();
		r.register(spec("a", { again: { description: "x", handler: async () => ({ content: [{ type: "text", text: "" }] }) } }));
		r.register(spec("b", { again: { description: "y", handler: async () => ({ content: [{ type: "text", text: "" }] }) } }));
		const names = r.listTools().map(t => t.name).sort();
		expect(names).toEqual(["a/again", "b/again"]);
	});
});

describe("ModuleRegistry.call", () => {
	const handler = async (args: Record<string, unknown>, ctx: ModuleContext) => ({
		content: [{ type: "text" as const, text: `${ctx.penRoot}:${String(args.key ?? "")}` }],
	});

	test("dispatches to the named tool with args and ctx", async () => {
		const r = new ModuleRegistry();
		r.register(spec("fathom", { ping: { description: "ping", handler } }));
		const out = await r.call("fathom/ping", { key: "hi" }, defaultCtx);
		expect(out.content[0]?.type).toBe("text");
		expect(out.content[0]?.text).toBe("/pens/fathom:hi");
	});

	test("throws on malformed name (no slash)", async () => {
		await expect(new ModuleRegistry().call("noslash", {}, defaultCtx)).rejects.toThrow(/malformed tool name/);
	});

	test("throws on malformed name (leading slash)", async () => {
		await expect(new ModuleRegistry().call("/ns/tool", {}, defaultCtx)).rejects.toThrow(/malformed tool name/);
	});

	test("throws on unknown module namespace", async () => {
		await expect(new ModuleRegistry().call("ghost/ping", {}, defaultCtx)).rejects.toThrow(/unknown module: ghost/);
	});

	test("throws on unknown tool within a known module", async () => {
		const r = new ModuleRegistry();
		r.register(spec("fathom", { ping: { description: "ping", handler } }));
		await expect(r.call("fathom/nope", {}, defaultCtx)).rejects.toThrow(/unknown tool fathom\/nope/);
	});

	test("propagates a handler rejection", async () => {
		const r = new ModuleRegistry();
		r.register(spec("fathom", { boom: { description: "boom", handler: async () => { throw new Error("kernel exploded"); } } }));
		await expect(r.call("fathom/boom", {}, defaultCtx)).rejects.toThrow(/kernel exploded/);
	});
});