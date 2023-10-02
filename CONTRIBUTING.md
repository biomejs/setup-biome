# Contribution Guidelines

Thank you for your interest in contributing to this project! Please review the
following guidelines before making your contribution.

> [!IMPORTANT]
> If you are considering making significant alterations to the project, we 
> suggest initiating a [discussion] to confirm that your proposed changes align
> with the project's objectives. Doing so can help you save both time and 
> effort.

[discussion]: https://github.com/biomejs/biome/discussions

## Project setup

1.  **Fork and clone the repo**. You will need to fork the repo and clone it
    locally to your machine. If you already have the [GitHub CLI][gh-link] 
    installed, you can run the following command.
    
    ```sh
    gh repo fork biomejs/setup-biome --clone
    ```

2.  **Install the dependencies**. We use [pnpm][pnpm-link] to manage the 
    dependencies. The installation process will also setup git hooks to ensure
    that your commits are formatted correctly. To install the dependencies, run
    the following command.
    
    ```sh
    pnpm install
    ```

[gh-link]: https://cli.github.com/
[pnpm-link]: https://pnpm.io/

## Making changes

1.  **Create a branch**. Before making any changes, create a branch to work on.
    
    ```sh
    git checkout -b <branch-name>
    ```

2. **Make your changes**. Make your changes to the codebase and commit them.
   The format of your commit messages is not important at this stage because
   they will be squashed later, but please ensure that your commit messages are
   descriptive. Git hooks will ensure that your commits are formatted correctly.
   
1. **Create a pull request**. Once you are done making your changes, push your
   branch to your fork and create a pull request. Please ensure that the title of your pull request follows the [conventional commits][cc-link] specification.

[cc-link]: https://www.conventionalcommits.org/en/v1.0.0/