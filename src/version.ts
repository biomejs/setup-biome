import { existsSync } from "node:fs";
import { join } from "node:path";
import { info, warning } from "@actions/core";
import { readFile } from "fs/promises";
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
export const getBiomeVersion = async (): Promise<string> => {
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
		return lockfile.packages?.["node_modules/@biome/biome"]?.version;
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
		return lockfile.dependencies?.["@biome/biome"]?.version;
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
