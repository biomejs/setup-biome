# Setup Biome CLI in GitHub Actions

[![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/biomejs/setup-biome?label=latest&logo=github)](https://github.com/marketplace/actions/setup-biome)
[![Test](https://github.com/biomejs/setup-biome/actions/workflows/test.yaml/badge.svg)](https://github.com/biomejs/setup-biome/actions/workflows/test.yaml)
[![Integrate](https://github.com/biomejs/setup-biome/actions/workflows/integrate.yaml/badge.svg)](https://github.com/biomejs/setup-biome/actions/workflows/integrate.yaml)

**Setup Biome** is a GitHub action that provides a cross-platform interface
for setting up the [Biome CLI](https://biomejs.dev) in GitHub
Actions runners.

## Inputs

The following inputs are supported.

```yaml
- name: Setup Biome
  uses: biomejs/setup-biome@v1
  with:

    # The version of the Biome CLI to install.
    # This input is optional and defaults to "latest".
    # Example values: "1.4.1", "latest"
    version: "latest"

    # The GitHub token to use to authenticate GitHub API requests.
    # This input is optional and defaults to the job's GitHub token.
    # Example value: ${{ secrets.GITHUB_TOKEN }}
    token: ${{ github.token }}
```

## Examples

### Basic example

Setup the latest version of the Biome CLI.

```yaml
- name: Setup Biome CLI
  uses: biomejs/setup-biome@v1

- name: Run Biome
  run: biome ci .
```

### Specific version

Install version `1.4.1` of the Biome CLI.

```yaml
- name: Setup Biome CLI
  uses: biomejs/setup-biome@v1
  with:
    version: 1.4.1

- name: Run Biome
  run: biome ci .
```

## License

Copyright © 2023, Nicolas Hedger. Released under the [MIT License](LICENSE.md).
