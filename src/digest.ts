import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { warning } from "@actions/core";

/**
 * Verifies a downloaded file against a GitHub release asset digest.
 *
 * GitHub records a digest (`sha256:<hex>`) for every release asset. Assets
 * uploaded before GitHub started recording digests have none: those cannot be
 * checked, so a warning is logged and the file is accepted. A digest in any
 * other form, or one that does not match the file, throws.
 */
export const verifyDigest = async (
	filePath: string,
	digest: string | null | undefined,
): Promise<void> => {
	if (!digest) {
		warning(
			"The release asset has no digest, so the downloaded Biome CLI could not be verified.",
		);
		return;
	}

	const [algorithm, expected] = digest.split(":", 2);
	if (algorithm !== "sha256" || !/^[0-9a-f]{64}$/i.test(expected ?? "")) {
		throw new Error(`Unsupported release asset digest: ${digest}`);
	}

	const actual = await sha256(filePath);
	if (actual !== expected.toLowerCase()) {
		throw new Error(
			`Checksum mismatch for the downloaded Biome CLI: expected sha256:${expected}, got sha256:${actual}.`,
		);
	}
};

const sha256 = (filePath: string): Promise<string> =>
	new Promise((resolve, reject) => {
		const hash = createHash("sha256");
		createReadStream(filePath)
			.on("error", reject)
			.on("data", (chunk) => hash.update(chunk))
			.on("end", () => resolve(hash.digest("hex")));
	});
