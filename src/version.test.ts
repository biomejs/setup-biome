import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { extractVersionFromPnpmLockFile } from "./version.ts";

describe("extractVersionFromPnpmLockFile", () => {
	test("lock", async () => {
		const v = await extractVersionFromPnpmLockFile("test/fixtures/pnpm");
		assert.equal(v, "2.0.0");
	});
	test("lock9", async () => {
		const v = await extractVersionFromPnpmLockFile("test/fixtures/pnpm-9");
		assert.equal(v, "2.0.0");
	});
	test("lock11", async () => {
		const v = await extractVersionFromPnpmLockFile("test/fixtures/pnpm-11");
		assert.equal(v, "2.0.0");
	});
});
