import fs from "node:fs";

const getLatestPackageVersion = async (packageName) => {
	const response = await fetch(
		`https://registry.npmjs.org/${packageName}/latest`,
	);
	const data = await response.json();
	return data.version;
};

const VERSION_REGEX = /(\d+\.\d+\.\d+)/g;

const updateReadmePackageVersions = async (packageName, readmePath) => {
	try {
		const newVersion = await getLatestPackageVersion(packageName);
		if (!newVersion) {
			throw new Error(`Failed to get latest version of ${packageName}`);
		}

		const originalContent = fs.readFileSync(readmePath, "utf8");
		const updatedContent = originalContent.replace(VERSION_REGEX, newVersion);

		if (originalContent !== updatedContent) {
			fs.writeFileSync(readmePath, updatedContent);
			console.info(`Updated version in ${readmePath} to ${newVersion}`);
			process.env.HAS_CHANGES = "true";
		} else {
			console.info(`No version changes needed in ${readmePath}`);
			process.env.HAS_CHANGES = "false";
		}
	} catch (error) {
		console.error("Failed to update", error);
	}
};

updateReadmePackageVersions("@biomejs/biome", "README.md");
