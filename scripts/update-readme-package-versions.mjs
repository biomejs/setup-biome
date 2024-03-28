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
		const latestVersion = await getLatestPackageVersion(packageName);
		if (!latestVersion) {
			throw new Error(`Failed to get latest version of ${packageName}`);
		}

		const originalContent = fs.readFileSync(readmePath, "utf8");
		const updatedContent = originalContent.replace(VERSION_REGEX, latestVersion);

		if (originalContent !== updatedContent) {
			fs.writeFileSync(readmePath, updatedContent);
			console.info(`Updated version in ${readmePath} to ${latestVersion}`);
		} else {
			console.info(`No version changes needed in ${readmePath}`);
		}
	} catch (error) {
		throw new Error(`Failed to update ${packageName} version in ${readmePath}`);
	}
};

updateReadmePackageVersions("@biomejs/biome", "README.md");
