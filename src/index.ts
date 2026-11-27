import { getBooleanInput } from "@actions/core";
import { createActionAuth } from "@octokit/auth-action";
import { Octokit } from "@octokit/rest";
import { setup } from "./setup.ts";
import type { Arch, Platform } from "./types.ts";
import { getBiomeVersion } from "./version.ts";

(async () => {
	const octokit = new Octokit({
		auth: (await createActionAuth()()).token,
	});

	await setup({
		version: await getBiomeVersion(octokit),
		platform: process.platform as Platform,
		architecture: process.arch as Arch,
		octokit: octokit,
		verifyDigest: getBooleanInput("verify-digest"),
	});
})();
