import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, mkdirSync, symlinkSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parsePorts, loadPens } from "../src/pen/estate";

describe("parsePorts — ports.env dialect", () => {
	test("parses KEY=PORT lines", () => {
		const out = parsePorts("BORNITE_PORT=25100\nTHRESHER_PORT=25127\n");
		expect(out.BORNITE_PORT).toBe(25100);
		expect(out.THRESHER_PORT).toBe(25127);
	});

	test("strips an inline # comment from the value", () => {
		const out = parsePorts("THRESHER_PORT=25127  # thresher gateway\n");
		expect(out.THRESHER_PORT).toBe(25127);
	});

	test("skips non-numeric values and blank/comment lines", () => {
		const out = parsePorts("# header\n\nHERD_PORT=25100\nNAME=bornite\n");
		expect(out.HERD_PORT).toBe(25100);
		expect(out.NAME).toBeUndefined();
	});

	test("strips surrounding whitespace on the key", () => {
		const out = parsePorts("  ABYSS_PORT = 25261  # private\n");
		expect(out.ABYSS_PORT).toBe(25261);
	});
});

describe("loadPens — broken-symlink resilience (real fs, temp root)", () => {
	let root: string;
	beforeEach(() => {
		root = mkdtempSync(join(tmpdir(), "pens-test-"));
		mkdirSync(join(root, "alpha", "products", "real-one"), { recursive: true });
		mkdirSync(join(root, "alpha", "docs"), { recursive: true });
		mkdirSync(join(root, "beta"), { recursive: true });
		try {
			symlinkSync("/nonexistent/ghost", join(root, "alpha", "products", "ghost"));
		} catch {
			// symlink may not be creatable in some sandboxes; skip rather than fail
		}
	});
	afterEach(() => rmSync(root, { recursive: true, force: true }));

	test("enumerates pens with product/docs counts and survives broken symlinks", async () => {
		const pens = loadPens(root);
		expect(Array.isArray(pens)).toBe(true);
		const alpha = pens.find(p => p.pen === "alpha");
		expect(alpha).toBeTruthy();
		expect(alpha?.products).toBe(1);
		expect(alpha?.docs).toBe(true);
		expect(pens.find(p => p.pen === "beta")?.products).toBe(0);
	});
});
