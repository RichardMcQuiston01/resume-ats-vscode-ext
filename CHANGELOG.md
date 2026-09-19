# CHANGELOG

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-09-19

### Added

- **Commands**: **Hired Hand: Create New Resume**, **Hired Hand: Edit Resume**, and
  **Hired Hand: Export Resume**, plus editor-title toolbar buttons for Edit/Export
  when `resume.json` is the active file.
- **Resume data model**: `ResumeData` and its section types (contact, summary,
  education, experience, skills, certifications, projects), a default-template
  factory, and `validateResumeData()` structural validation.
- **Webview editor**: a form-based editor for `resume.json` with add/remove controls
  for repeatable sections. Saves are re-validated before being written to disk.
- **ATS compatibility checks**: `checkAtsCompatibility()` flags missing contact info,
  a missing summary, no experience/skills entries, experience entries with no
  highlights, overlong highlight bullets, unsafe/decorative characters, and duplicate
  skills within a group. Warnings are surfaced live in the Problems panel as VS Code
  diagnostics on `resume.json`, updating as the file is edited.
- **Export pipeline**: exports `resume.json` to Markdown, HTML, DOCX (`docx`), or PDF
  (`pdf-lib`), written alongside `resume.json`. HTML/DOCX/PDF output stays
  single-column with no tables or images. Export refuses to run against an invalid
  `resume.json`.
- **Extension icon**, Marketplace keywords, and gallery banner color.
- **Project scaffold**: `package.json`, TypeScript config, esbuild bundling (two
  entry points: the extension host and the webview script), ESLint + Prettier
  (Google TypeScript Style Guide conventions).
- **Tests**: a unit test suite (`npm run test:unit`, plain Mocha, no VS Code
  dependency) covering the data model, validator, ATS rules, webview form-state
  helpers, and all four exporters (including structural verification of the
  generated DOCX and PDF output); a VS Code integration test suite
  (`npm run test:integration`) covering command registration, live diagnostics, and
  an end-to-end create → fill → validate → export flow.
- **CI**: a workflow running typecheck, lint, format check, and both test suites on
  pull requests and pushes to `dev`, `staging`, and `main`; a Marketplace publish
  workflow triggered by pushing a `vX.Y.Z` tag.
- `.vscodeignore` so the packaged extension ships only runtime files (`dist/`,
  `resources/icon.png`, docs) instead of source, tests, and dev tooling.
- `CONTRIBUTING.md` documenting the branch workflow and development plan.

### Fixed

- The donation QR code in `README.md` is now a PNG (`donate.png`) instead of an SVG:
  `vsce package` rejects README images in SVG format, which blocked packaging the
  extension for the Marketplace.
