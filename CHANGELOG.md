# CHANGELOG

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Project scaffold: `package.json`, TypeScript config, and esbuild bundling.
- Placeholder `hiredHand.createResume` command.
- ESLint + Prettier configuration.
- Test harness (`@vscode/test-cli` + `@vscode/test-electron` + Mocha) with an initial
  activation test.
- CI workflow running typecheck, lint, format check, and tests on pull requests and
  pushes to `dev`, `staging`, and `main`.
- Marketplace publish workflow, triggered by pushing a `vX.Y.Z` tag.
- `CONTRIBUTING.md` documenting the branch workflow and development plan.
