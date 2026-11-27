import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, test } from "node:test";
import { verifyDigest } from "./digest.ts";

const file = join(mkdtempSync(join(tmpdir(), "setup-biome-")), "biome");
writeFileSync(file, "biome binary");
const sha256 = createHash("sha256").update("biome binary").digest("hex");

describe("verifyDigest", () => {
	test("accepts a matching digest", async () => {
		await verifyDigest(file, `sha256:${sha256}`);
	});
	test("accepts an upper-case digest", async () => {
		await verifyDigest(file, `sha256:${sha256.toUpperCase()}`);
	});
	test("rejects a mismatching digest", async () => {
		await assert.rejects(
			verifyDigest(file, `sha256:${"0".repeat(64)}`),
			/Checksum mismatch/,
		);
	});
	test("rejects an unsupported algorithm", async () => {
		await assert.rejects(
			verifyDigest(file, `sha1:${"0".repeat(40)}`),
			/Unsupported release asset digest/,
		);
	});
	test("rejects a malformed digest", async () => {
		await assert.rejects(
			verifyDigest(file, "sha256:not-hex"),
			/Checksum mismatch/,
		);
	});
	test("rejects an empty digest value", async () => {
		await assert.rejects(
			verifyDigest(file, "sha256:"),
			/Unsupported release asset digest/,
		);
	});
	test("warns and accepts when the asset has no digest", async () => {
		await verifyDigest(file, null);
		await verifyDigest(file, undefined);
	});
});
