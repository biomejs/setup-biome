# Setup Biome CLI in GitHub Actions

[![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/biomejs/setup-biome?label=latest&logo=github&labelColor=374151&color=60a5fa)](https://github.com/marketplace/actions/setup-biome)
[![Test](https://github.com/biomejs/setup-biome/actions/workflows/test.yaml/badge.svg)](https://github.com/biomejs/setup-biome/actions/workflows/test.yaml)
[![Integrate](https://github.com/biomejs/setup-biome/actions/workflows/integrate.yaml/badge.svg)](https://github.com/biomejs/setup-biome/actions/workflows/integrate.yaml)

**Setup Biome** is a GitHub action that provides a cross-platform interface
for setting up the [Biome CLI](https://biomejs.dev) in GitHub
Actions runners.

## Inputs

The following inputs are supported.

```yaml
- name: Setup Biome
  uses: biomejs/setup-biome@v2
  with:

    # The version of the Biome CLI to install.
    # This input is optional and by default the version will be automatically
    # detected from the project's dependencies. If no version is found in the
    # project's dependencies, the latest version of the Biome CLI will be installed.
    # Example values: "1.9.4", "latest"
    version: ""

    # The GitHub token to use to authenticate GitHub API requests.
    # This input is optional and defaults to the job's GitHub token.
    # Example value: ${{ secrets.GITHUB_TOKEN }}
    token: ${{ github.token }}

    # The directory in which the lockfile will be looked for when automatically
    # determining the version of the Biome CLI to install. Defaults to the current
    # working directory.
    working-dir: ""
```

## Examples

### Automatic version detection

To automatically determine the version of Biome to install based on the project's dependencies, you can simply omit the `version` input.

The action will look for the version of the `@biomejs/biome` dependency in the lockfiles of popular package managers such as npm, yarn, pnpm, and bun. If the version cannot be found in the lockfiles, the action will attempt to retrieve the version from the `package.json` file, and as a last
resort, it will install the latest version of the Biome CLI.

```yaml
- name: Setup Biome CLI
  uses: biomejs/setup-biome@v2

- name: Run Biome
  run: biome ci
```

> [!IMPORTANT]
> We recommend that you *pin* the version of `@biomejs/biome` in your project's dependencies. If you provide a semver range, and automatic version detection falls back to reading the `package.json file`, the highest version within the range will be used. See the [versioning documentation](https://biomejs.dev/internals/versioning/) for more information.

### Latest version

Setup the latest version of the Biome CLI.

```yaml
- name: Setup Biome CLI
  uses: biomejs/setup-biome@v2
  with:
    version: latest

- name: Run Biome
  run: biome ci
```

### Specific version

Install version `1.9.4` of the Biome CLI.

```yaml
- name: Setup Biome CLI
  uses: biomejs/setup-biome@v2
  with:
    version: 1.9.4

- name: Run Biome
  run: biome ci
```

## License

Copyright © 2023, Nicolas Hedger. Released under the [MIT License](LICENSE.md).
