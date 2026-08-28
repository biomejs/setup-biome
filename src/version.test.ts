import { describe, expect, test } from "bun:test";
import { extractVersionFromPnpmLockFile } from "./version";

describe("extractVersionFromPnpmLockFile", () => {
	test("lock", async () => {
		const v = await extractVersionFromPnpmLockFile("test/fixtures/pnpm");
		expect(v).toBe("2.0.0");
	});
	test("lock9", async () => {
		const v = await extractVersionFromPnpmLockFile("test/fixtures/pnpm-9");
		expect(v).toBe("2.0.0");
	});
	test("lock11", async () => {
		const v = await extractVersionFromPnpmLockFile("test/fixtures/pnpm-11");
		expect(v).toBe("2.0.0");
	});
});
