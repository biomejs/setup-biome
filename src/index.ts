import { createActionAuth } from "@octokit/auth-action";
import { Octokit } from "@octokit/rest";
import { setup } from "./setup";
import type { Arch, Platform } from "./types";
import { getBiomeVersion } from "./version";

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
