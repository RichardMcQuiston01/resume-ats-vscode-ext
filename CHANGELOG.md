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
- Resume data model (`ResumeData` and its section types: contact, summary, education,
  experience, skills, certifications, projects) and `validateResumeData()` structural
  validation.
- **Hired Hand: Create New Resume** now scaffolds a `resume.json` in the workspace root
  from the default template (or opens the existing one) instead of showing a placeholder
  message.
- Unit test suite (`npm run test:unit`) for the resume data model and validator, run
  independently of the VS Code integration tests.
- **Hired Hand: Edit Resume** — a webview-based form editor for `resume.json`, with
  add/remove controls for repeatable sections (education, experience, skills,
  certifications, projects). Saves are validated with `validateResumeData()` before
  being written to disk.
- Unit tests for the webview's pure form-state helpers (highlights/skills text
  parsing, empty-entry factories).
