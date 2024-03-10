import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { info, warning } from "@actions/core";
import type { Octokit } from "@octokit/rest";
import {
	type SemVer,
	coerce,
	maxSatisfying,
	rsort,
	valid,
	validRange,
} from "semver";
import { parse } from "yaml";
import { getInput } from "./helpers";

/**
 * Determines the version of the Biome CLI to setup.
 *
 * This function will first check the `version` input. If the input is set
 * to a valid version, that version will be used. If the input is set to
 * `latest`, the latest release of the Biome CLI will be used. If the input
 * is not set, the version of the Biome CLI installed in the project's dependencies
 * will be used. As a fallback, the latest release of the Biome CLI will be used.
 *
 * @param projectRoot The root directory of the project. Defaults to the current working directory.
 */
export const getBiomeVersion = async (octokit: Octokit): Promise<string> => {
	let root = getInput("working-dir");

	// If the working directory is not specified, we fallback to the current
	// working directory.
	if (!root) {
		root = process.cwd();
		info(
			"No working directory specified. Using the current working directory.",
		);
	}

	// If the working directoy has been specified, but does not exist,
	// we fallback to the current working directory.
	if (root && !existsSync(join(root))) {
		root = process.cwd();
		warning(
			"The specified working directory does not exist. Using the current working directory instead.",
		);
	}

	return (
		getInput("version") ??
		(await extractVersionFromNpmLockFile(root)) ??
		(await extractVersionFromPnpmLockFile(root)) ??
		(await extractVersionFromYarnLockFile(root)) ??
		(await extractVersionFromPackageManifest(root, octokit)) ??
		"latest"
	);
};

/**
 * Extracts the Biome CLI version from the project's
 * package-lock.json file.
 *
 * If the lock file does not exist, or biome is not installed,
 * this function will return undefined.
 */
const extractVersionFromNpmLockFile = async (
	root: string,
): Promise<string | undefined> => {
	try {
		const lockfile = JSON.parse(
			await readFile(join(root, "package-lock.json"), "utf-8"),
		);
		return lockfile.packages?.["node_modules/@biomejs/biome"]?.version;
	} catch {
		return undefined;
	}
};

/**
 * Extracts the Biome CLI version from the project's
 * pnpm-lock.yaml file.
 */
const extractVersionFromPnpmLockFile = async (
	root: string,
): Promise<string | undefined> => {
	try {
		const lockfile = parse(
			await readFile(join(root, "pnpm-lock.yaml"), "utf8"),
		);
		return (
			lockfile.devDependencies?.["@biomejs/biome"]?.version ??
			lockfile.dependencies?.["@biomejs/biome"]?.version
		);
	} catch {
		return undefined;
	}
};

/**
 * Extracts the Biome CLI version from the project's
 * yarn.lock file.
 */
const extractVersionFromYarnLockFile = async (
	root: string,
): Promise<string | undefined> => {
	try {
		const lockfile = parse(
			await readFile(join(root, "yarn.lock"), "utf8"),
		).object;
		const biome = Object.keys(lockfile).filter((name) =>
			name.startsWith("@biomejs/biome@"),
		)[0];
		return lockfile[biome]?.version;
	} catch {
		return undefined;
	}
};

/**
 * Extracts the Biome CLI version from the project's package.json file.
 *
 * This function attempts to extract the version of the `@biomejs/biome`
 * package from the `package.json` file. If the package is not installed,
 * or the version cannot be extracted, this function will return undefined.
 *
 * If the version is specified as a range, this function will return the
 * highest available version that satisfies the range, if it exists, or
 * undefined otherwise.
 */
const extractVersionFromPackageManifest = async (
	root: string,
	octokit: Octokit,
): Promise<string | undefined> => {
	try {
		const manifest = JSON.parse(
			await readFile(join(root, "package.json"), "utf8"),
		);

		// The package should be installed as a devDependency, but we'll check
		// both dependencies and devDependencies just in case.
		const versionSpecifier =
			manifest.devDependencies?.["@biomejs/biome"] ??
			manifest.dependencies?.["@biomejs/biome"];

		// Biome is not a dependency of the project.
		if (!versionSpecifier) {
			return undefined;
		}

		// If the version is specific, we return it directly.
		if (valid(versionSpecifier)) {
			return versionSpecifier;
		}

		// If the version is a range, return the highest available version.
		if (validRange(versionSpecifier)) {
			warning(
				`Please consider pinning the version of @biomejs/biome in your package.json file.
				See https://biomejs.dev/internals/versioning/ for more information.`,
				{ title: "Biome version range detected" },
			);

			const versions = await fetchBiomeVersions(octokit);

			if (!versions) {
				return undefined;
			}

			return maxSatisfying(versions, versionSpecifier)?.version ?? undefined;
		}
	} catch {
		return undefined;
	}
};

/**
 * Fetches the available versions of the Biome CLI from GitHub.
 *
 * This function will return the versions of the Biome CLI that are available
 * on GitHub. This includes all versions that have been released, including
 * pre-releases and draft releases.
 */
const fetchBiomeVersions = async (
	octokit: Octokit,
): Promise<SemVer[] | undefined> => {
	try {
		const releases = await octokit.paginate(
			"GET /repos/{owner}/{repo}/releases",
			{
				owner: "biomejs",
				repo: "biome",
			},
		);

		const versions = releases
			.filter((release) => release.tag_name.startsWith("cli/"))
			.map((release) => coerce(release.tag_name));

		return rsort(versions as SemVer[]);
	} catch {
		return undefined;
	}
};
