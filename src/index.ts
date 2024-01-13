import { createActionAuth } from "@octokit/auth-action";
import { Octokit } from "@octokit/rest";
import { setup } from "./setup";
import { getBiomeVersion } from "./version";

(async () => {
	const octokit = new Octokit({
		auth: (await createActionAuth()()).token,
	});

	await setup({
		version: await getBiomeVersion(octokit),
		platform: process.platform as "linux" | "darwin" | "win32",
		architecture: process.arch as "x64" | "arm64",
		octokit: octokit,
	});
})();
