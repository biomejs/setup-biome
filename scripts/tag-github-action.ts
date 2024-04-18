import { spawnSync } from "node:child_process";
import { exit } from "node:process";
import { parse } from "semver";

const version = parse(process.argv[2]);

if (!version) {
	console.error(`Invalid version provided: ${version}`);
	console.info(
		"Version must be a valid semver version in the format of MAJOR.MINOR.PATCH",
	);
	exit(1);
}

const tags = [
	`v${version.major}`,
	`v${version.major}.${version.minor}`,
	`v${version.major}.${version.minor}.${version.patch}`,
];

console.info("Creating tags...");
for (const tag of tags) {
	spawnSync("git", ["tag", tag, "--force", `--message="chore: tag ${tag}"`]);
	console.info(`- Created tag: ${tag}`);
}

console.info(
	"Tags created successfully. Run `git push --tags --force` to push them to the remote.",
);
