# CHANGELOG

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Export style settings** (`hiredHand.export.*`): tune the HTML, Word, and PDF exports for the people who
  read them. Choose a preset (`classic`, `compact`, `standard`, `comfortable`) and optionally override the
  font family (sans-serif, serif, monospace), body, name, and heading sizes, line spacing, section and entry
  spacing, margins, paper size (Letter or A4), and heading case. Exports stay ATS-friendly (a single column of
  real text with real headings); out-of-range values are ignored with a message naming the setting, and
  readability concerns (for example body text under 10 pt) are noted without blocking the export.
- A4 paper size for PDF and Word exports.
- **`hiredHand.export.projectLinks`**: choose where a project's links go in the HTML, Word, and PDF exports:
  on its own line under the project (`below`, the default), on the project's heading line after its name
  (`heading`), or not at all (`off`).
- **More project and certification details** in `resume.json` and **Edit Resume**: a project can now have a
  repository URL, a demo URL, a tech stack, and an outcome, and a certification can have a credential URL.
  Existing `resume.json` files keep working; the new fields default to empty. The HTML, Word, and PDF exports
  leave the new details out unless you turn them on with `hiredHand.export.projectTechStack`,
  `projectOutcome`, `credentialUrl` (and `projectLinks`, which now also covers the repository and demo links).
  Markdown exports list everything you entered. **Edit Resume** warns about a link that is not a web address.

### Changed

- HTML, Word, and PDF exports are now produced by the shared `@richardmcquiston01/ats-resume-export` package
  instead of this extension's own code. The `classic` preset (the default) approximates the previous look, but
  spacing and fonts differ slightly, and the three formats now match each other more closely. Visible
  differences: the education GPA appears as a bullet under the degree, a blank name falls back to "Resume"
  (was "Untitled"), and the LinkedIn and portfolio links sit on their own line under the contact details.
  Your section order, Bold/Italic highlights, and project URLs are preserved; a project's URL now appears as
  "Link: <url>" on its own line rather than appended to the description (use `projectLinks` to move or hide it).

## [0.2.0] - 2026-09-22

### Added

- **Edit Resume webview**: Email, Phone, LinkedIn URL, and Portfolio URL now use
  native `email`/`tel`/`url` input fields instead of plain text, and Phone is capped
  at 20 characters. A small Errors/Warnings summary above the bottom Save button
  lists missing required fields (Errors, blocking Save) and malformed
  email/phone/LinkedIn/Portfolio values (Warnings, non-blocking) as you type.
- **Edit Resume webview**: Save, Add, and Remove buttons now show an icon
  alongside their label.
- **Edit Resume webview**: restyled to match the other Hired Hand products'
  branding (dark navy chrome with an orange accent) instead of following the
  editor's own color theme. Required-field markers and the floating
  jump-to-top button now use the brand orange as well.
- **Edit Resume webview**: a Bold/Italic toolbar above each Highlights field
  wraps the selected text with Markdown-style `**bold**`/`*italic*` markers.
  The Markdown export already rendered these as-is; HTML, DOCX, and PDF
  exports now parse that markup and render real bold/italic text.
- **Edit Resume webview**: Graduation date, Start date, and Issue date are now
  native month pickers instead of free-text fields. Experience entries also
  get a "Present" checkbox for End date, which sets it to `"Present"` and
  disables the picker for ongoing roles.
- **Edit Resume webview**: Full Name, Email, Job Title, Employer, Institution,
  and Degree are now marked required. A missing field is outlined in red and
  Save is disabled with a message naming the first missing field, so an
  incomplete `resume.json` can never be written — enforced both in the
  webview and, defense in depth, when the extension handles the save request.
- **Edit Resume webview**: whole sections (Education, Experience, Skills,
  Certifications, Projects) can now be reordered with ▲/▼ buttons in each
  section's header. The chosen order (`sectionOrder` in `resume.json`) also
  controls the order sections appear in every exported format (Markdown,
  HTML, DOCX, PDF). Resumes saved before this feature default to the
  previous fixed order.
- **Edit Resume webview**: entries within a repeatable section (Education,
  Experience, Skills, Certifications, Projects) now have up/down buttons to
  reorder them, alongside Remove.
- **Edit Resume webview**: a Save button in a sticky header (in addition to the
  existing one at the bottom of the form) and a floating "jump to top" button.
- Buttons in the webview are now styled with VS Code's theme colors
  (`--vscode-button-*`), so they stay correct across light, dark, and
  high-contrast themes instead of using unstyled default buttons.

### Security

- Bumped dev/build tooling (`esbuild`, `@vscode/vsce`, `@vscode/test-cli`,
  `mocha`) to their latest versions, resolving 3 of the 7 `npm audit`
  findings (esbuild's dev-server request vulnerability; `markdown-it` /
  `linkify-it` ReDoS pulled in by an old `vsce`; `serialize-javascript`'s RCE
  and DoS advisories pulled in by an old `mocha`). None of these packages
  are runtime dependencies — they never ship in the packaged extension —
  but keeping them current avoids exposure on contributors' and CI
  machines. The remaining 4 findings live inside `@vscode/test-cli`'s own
  vendored `mocha`; `@vscode/test-cli` is already at its latest published
  version (`0.0.15`) and has no newer release that pulls a fixed `mocha`,
  so this is blocked on an upstream update.

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
