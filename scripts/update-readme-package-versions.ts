import fs from "node:fs";

const getLatestPackageVersion = async (
	packageName: string,
): Promise<string> => {
	const response = await fetch(
		`https://registry.npmjs.org/${packageName}/latest`,
	);
	const data = await response.json();
	if (
		data &&
		typeof data === "object" &&
		"version" in data &&
		typeof data.version === "string"
	) {
		return data.version;
	}

	throw new Error(`Failed to get latest version of ${packageName}`);
};

const VERSION_REGEX = /(\d+\.\d+\.\d+)/g;

const updateReadmePackageVersions = async (
	packageName: string,
	readmePath: string,
) => {
	try {
		const latestVersion = await getLatestPackageVersion(packageName);

		const originalContent = fs.readFileSync(readmePath, "utf8");
		const updatedContent = originalContent.replace(
			VERSION_REGEX,
			latestVersion,
		);

		if (originalContent !== updatedContent) {
			fs.writeFileSync(readmePath, updatedContent);
			console.info(`Updated version in ${readmePath} to ${latestVersion}`);
		} else {
			console.info(`No version changes needed in ${readmePath}`);
		}
		process.exit(0);
	} catch (error) {
		console.error("Failed to update", error);
		process.exit(1);
	}
};

updateReadmePackageVersions("@biomejs/biome", "README.md");
