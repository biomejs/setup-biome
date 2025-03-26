import { chmodSync, renameSync } from "node:fs";
import { dirname, join } from "node:path";
import { addPath, error, setFailed } from "@actions/core";
import { downloadTool } from "@actions/tool-cache";
import { RequestError } from "@octokit/request-error";
import { Octokit } from "@octokit/rest";
import { type SemVer, coerce, rsort } from "semver";
import { getTag } from "./helpers";

/**
 * Biome Setup Options
 */
export interface SetupOptions {
	/**
	 * Version of the Biome CLI to download
	 */
	version?: string;

	/**
	 * Operating system to download the CLI for
	 */
	platform: "linux" | "darwin" | "win32";

	/**
	 * Architecture to download the CLI for
	 */
	architecture: "x64" | "arm64";

	/**
	 * Octokit instance to use for API calls
	 */
	octokit: Octokit;
}

const defaultOptions: SetupOptions = {
	version: "latest",
	platform: process.platform as "linux" | "darwin" | "win32",
	architecture: process.arch as "x64" | "arm64",
	octokit: new Octokit(),
};

export const setup = async (config: Partial<SetupOptions>) => {
	const options: SetupOptions = { ...defaultOptions, ...config };

	try {
		const cliPath = await download(options);
		await install(cliPath, options);
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.log(error.message);
			setFailed(error.message);
		}
	}
};

/**
 * Downloads the Biome CLI
 */
const download = async (options: SetupOptions): Promise<string> => {
	try {
		const releaseId = await findRelease(options);
		const assetURL = await findAsset(releaseId, options);
		return await downloadTool(assetURL);
	} catch (error) {
		if (error instanceof RequestError) {
			const requestError = error as RequestError;
			if (
				requestError.status === 403 &&
				requestError.response?.headers["x-ratelimit-remaining"] === "0"
			) {
				throw new Error(`
                    You have exceeded the GitHub API rate limit.
                    Please try again in ${requestError.response?.headers["x-ratelimit-reset"]} seconds.
                    If you have not already done so, you can try authenticating calls to the GitHub API
                    by setting the \`GITHUB_TOKEN\` environment variable.
                `);
			}
		}
		throw error;
	}
};

/**
 * Finds the release for the given version
 */
const findRelease = async (options: SetupOptions) => {
	let versionToDownload = coerce(options.version);

	try {
		if (options.version === "latest") {
			const releases = await options.octokit.paginate(
				"GET /repos/{owner}/{repo}/releases",
				{
					owner: "biomejs",
					repo: "biome",
				},
			);

			const versions = releases
				.filter((release) => {
					return (
						(release.tag_name.startsWith("cli/") ||
							release.tag_name.startsWith("@biomejs/biome@")) &&
						!release.draft
					);
				})
				.map((release) => {
					return coerce(release.tag_name);
				});

			const sortedVersions = rsort(versions as SemVer[]);

			versionToDownload = sortedVersions[0];
		}

		if (!versionToDownload) {
			error(
				"Invalid version specified. It should be a valid semver version or 'latest'.",
			);
			return;
		}

		return (
			await options.octokit.repos.getReleaseByTag({
				owner: "biomejs",
				repo: "biome",
				tag: getTag(versionToDownload),
			})
		).data.id;
	} catch (error) {
		if (error instanceof RequestError) {
			const requestError = error as RequestError;
			if (requestError.status === 404) {
				throw new Error(
					`Version ${options.version} of the Biome CLI does not exist.`,
				);
			}
			throw error;
		}
		throw error;
	}
};

/**
 * Finds the asset for the given release ID and options
 */
const findAsset = async (releaseId: number, options: SetupOptions) => {
	const assets = await options.octokit.paginate(
		"GET /repos/{owner}/{repo}/releases/{release_id}/assets",
		{
			owner: "biomejs",
			repo: "biome",
			release_id: releaseId,
		},
	);

	const patterns: Map<string, string> = new Map([
		["linux", `linux-${options.architecture}`],
		["darwin", `darwin-${options.architecture}`],
		["win32", `win32-${options.architecture}.exe`],
	]);

	const asset = assets.find((asset) =>
		asset.name.endsWith(
			patterns.get(options.platform) as SetupOptions["platform"],
		),
	);

	if (!asset) {
		throw new Error(
			`Could not find an Biome CLI release for ${options.platform} (${options.architecture}) for the given version (${options.version}).`,
		);
	}

	return asset.browser_download_url;
};

/**
 * Installs the downloaded Biome CLI
 */
const install = async (cliPath: string, options: SetupOptions) => {
	const biomePath = join(
		dirname(cliPath),
		`${options.platform === "win32" ? "biome.exe" : "biome"}`,
	);

	// Rename the binary to biome
	renameSync(cliPath, biomePath);

	// Make it executable
	chmodSync(biomePath, "755");

	addPath(dirname(cliPath));
};
