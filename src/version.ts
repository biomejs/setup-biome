import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { info, warning } from "@actions/core";
import type { Octokit } from "@octokit/rest";
import type { LockfileFile } from "@pnpm/lockfile-types";
import { parse as parseJSONC } from "@std/jsonc";
import { findUp } from "find-up-simple";
import {
	coerce,
	maxSatisfying,
	rsort,
	type SemVer,
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

	// If the working directory has been specified, but does not exist,
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
		(await extractVersionFromBunLockFile(root)) ??
		(await extractVersionFromPackageManifest(root, octokit)) ??
		(await extractVersionFromBiomeConfigFile(root)) ??
		fallbackToLatestVersion()
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
		info("Looking for Biome version in npm lock file (package-lock.json)");
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
		info("Looking for Biome version in pnpm lock file (pnpm-lock.yaml)");
		const lockfile: LockfileFile = parse(
			await readFile(join(root, "pnpm-lock.yaml"), "utf8"),
		);

		return (
			extractVersionFromPnpmLockFileV9(lockfile) ??
			extractVersionFromPnpmLockFileLegacy(lockfile)
		);
	} catch {
		return undefined;
	}
};

/**
 * Extracts the version from legacy pnpm lock files (prior to v9).
 */
const extractVersionFromPnpmLockFileLegacy = (
	lockfile: LockfileFile,
): string | undefined => {
	return (
		lockfile.devDependencies?.["@biomejs/biome"]?.version ??
		lockfile.dependencies?.["@biomejs/biome"]?.version
	);
};

/**
 * Extracts the version from pnpm lock files v9
 */
const extractVersionFromPnpmLockFileV9 = (
	lockfile: LockfileFile,
): string | undefined => {
	return (
		lockfile.importers?.["."]?.devDependencies?.["@biomejs/biome"]?.version ??
		lockfile.importers?.["."]?.dependencies?.["@biomejs/biome"]?.version
	);
};

/**
 * Extracts the Biome CLI version from the project's
 * yarn.lock file.
 */
const extractVersionFromYarnLockFile = async (
	root: string,
): Promise<string | undefined> => {
	try {
		info("Looking for Biome version in yarn lock file (yarn.lock)");
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
 * Extracts the Biome CLI version from the project's
 * bun.lock file.
 */
const extractVersionFromBunLockFile = async (
	root: string,
): Promise<string | undefined> => {
	try {
		info("Looking for Biome version in bun lock file (bun.lock)");
		const lockfile = parse(
			await readFile(join(root, "bun.lock"), "utf8"),
		).packages;

		return lockfile["@biomejs/biome"][0].split("@").pop();
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
		info("Looking for Biome version in package manifest (package.json)");

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

		// If the version is a catalog specifier, we check pnpm-workspace.
		if (versionSpecifier.startsWith("catalog:")) {
			const catalogName = versionSpecifier.split(":")[1];
			return await extractVersionFromPnpmWorkspaceFile(root, catalogName);
		}
	} catch {
		return undefined;
	}
};

/**
 * Extracts the Biome CLI version from the Biome config file.
 *
 * This function attempts to extract the version of Biome from the
 * `$schema` field in any Biome configuration file (biome.json(c))
 * present in the specified root directory.
 */
const extractVersionFromBiomeConfigFile = async (
	root: string,
): Promise<string | undefined> => {
	const configFilenames = ["biome.json", "biome.jsonc"];

	for (const filename of configFilenames) {
		info(`Looking for Biome version in config file (${filename})`);

		const configPath = join(root, filename);
		if (!existsSync(configPath)) {
			continue;
		}

		try {
			const configFileContent = await readFile(configPath, "utf8");
			const config = parseJSONC(configFileContent);
			return coerce(config.$schema)?.version;
		} catch {}
	}

	return undefined;
};

/**
 * Extracts the Biome CLI version from the project's
 * pnpm-workspace.yaml file.
 */
const extractVersionFromPnpmWorkspaceFile = async (
	root: string,
	catalogName?: string,
): Promise<string | undefined> => {
	try {
		info(
			"Looking for Biome version in pnpm workspace file (pnpm-workspace.yaml)",
		);

		const workspacePath = await findUp("pnpm-workspace.yaml", { cwd: root });
		if (!workspacePath) {
			return undefined;
		}

		const workspaceFile = parse(await readFile(workspacePath, "utf8"));
		return (
			workspaceFile.catalogs?.[catalogName ?? ""]?.["@biomejs/biome"] ??
			workspaceFile.catalog?.["@biomejs/biome"]
		);
	} catch {
		return undefined;
	}
};

/**
 * Fetches the available versions of the Biome CLI from GitHub.
 *
 * This function will return the versions of the Biome CLI that are available
 * on GitHub. This includes all versions that have been released, including
 * pre-releases.
 *
 * Starting from Biome v2.0.0-beta.0, the format of the tags have changed from
 * `cli/v1.9.4` to `@biomejs/biome@2.0.0-beta.0`.
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
			.filter(
				(release) =>
					(release.tag_name.startsWith("cli/") ||
						release.tag_name.startsWith("@biomejs/biome@")) &&
					!release.draft,
			)
			.map((release) => coerce(release.tag_name, { includePrerelease: true }));

		return rsort(versions as SemVer[]);
	} catch {
		return undefined;
	}
};

/**
 * Fallback to the latest version of Biome.
 */
const fallbackToLatestVersion = (): string => {
	warning(
		`Could not determine the Biome version from the project files. Falling back to the latest version. 
		If this is unexpected, make sure your repository has been checked out and that the working-dir input
		is set to the directory containing your project (defaults to the root of the repository).`,
	);
	return "latest";
};
