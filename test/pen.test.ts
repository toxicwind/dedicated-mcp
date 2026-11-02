import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { listOpsScripts } from "../src/pen/barn";
import { listForgeProducts } from "../src/pen/forge";

describe("barn listOpsScripts", () => {
	let root: string;
	beforeEach(() => {
		root = mkdtempSync(join(tmpdir(), "barn-test-"));
		writeFileSync(join(root, "bin-verify.sh"), "#!/bin/sh\n");
		writeFileSync(join(root, ".hidden"), "x");
		writeFileSync(join(root, "README.md"), "# readme\n");
	});
	afterEach(() => rmSync(root, { recursive: true, force: true }));

	test("lists only non-hidden files, sorted, and never crashes on missing root", () => {
		expect(listOpsScripts(root)).toEqual(["README.md", "bin-verify.sh"]);
		expect(listOpsScripts(join(root, "nope"))).toEqual([]);
	});
});

describe("forge listForgeProducts", () => {
	let root: string;
	beforeEach(() => {
		root = mkdtempSync(join(tmpdir(), "forge-test-"));
		mkdirSync(join(root, "operators"), { recursive: true });
		mkdirSync(join(root, "plumbing"), { recursive: true });
		writeFileSync(join(root, ".gitkeep"), "");
	});
	afterEach(() => rmSync(root, { recursive: true, force: true }));

	test("lists only directories, excludes dotfiles, sorted, safe on missing root", () => {
		expect(listForgeProducts(root)).toEqual(["operators", "plumbing"]);
		expect(listForgeProducts(join(root, "nope"))).toEqual([]);
	});
});
