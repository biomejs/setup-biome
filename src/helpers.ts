import { getInput as coreGetInput } from "@actions/core";
import type { SemVer } from "semver";

export const getInput = (name: string): string | undefined => {
	return coreGetInput(name) === "" ? undefined : coreGetInput(name);
};

/**
 * Returns the tag for the specified version of the Biome CLI.
 *
 * Prior to v2, Biome CLI was tagged with `cli/vX.Y.Z`.
 * Starting from v2, Biome CLI is tagged with `@biomejs/biome@X.Y.Z`.
 *
 * This function takes a SemVer object and returns the appropriate tag.
 */
export const getTag = (version: SemVer) => {
	if (version.major >= 2) {
		return `@biomejs/biome@${version.version}`;
	}

	return `cli/v${version.version}`;
};
