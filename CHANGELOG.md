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
- ATS compatibility checks: `checkAtsCompatibility()` flags missing contact info,
  missing summary, no experience/skills entries, experience entries with no
  highlights, overlong highlight bullets, unsafe/decorative characters, and duplicate
  skills within a group. Warnings are surfaced live in the Problems panel as VS Code
  diagnostics on `resume.json` (via `jsonc-parser` for JSON-path-to-range mapping),
  updating as the file is edited.
- **Hired Hand: Export Resume** — exports `resume.json` to Markdown, HTML, DOCX
  (`docx`), or PDF (`pdf-lib`), written alongside `resume.json` in the workspace root.
  The HTML/DOCX/PDF output is single-column with no tables or images, matching the
  ATS-safe structure `checkAtsCompatibility()` already enforces on the source data.
  Export refuses to run against an invalid `resume.json`.
- Unit tests for the Markdown/HTML/DOCX/PDF exporters, including structural
  verification of the generated DOCX (a valid ZIP with `word/document.xml`) and PDF
  (re-parsed with `pdf-lib` itself) output.
