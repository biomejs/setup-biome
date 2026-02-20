import { createActionAuth } from "@octokit/auth-action";
import { Octokit } from "@octokit/rest";
import { setup } from "./setup";
import { getBiomeVersion } from "./version";
import type { Arch, Platform } from "./types";

(async () => {
	const octokit = new Octokit({
		auth: (await createActionAuth()()).token,
	});

	await setup({
		version: await getBiomeVersion(octokit),
		platform: process.platform as Platform,
		architecture: process.arch as Arch,
		octokit: octokit,
	});
})();
