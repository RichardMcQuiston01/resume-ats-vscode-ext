# Contributing

## Branch workflow

```
feature/*  --PR-->  dev  --merge-->  staging  --merge-->  main  --tag vX.Y.Z-->  Marketplace
```

- **`feature/<short-description>`** — cut from `dev`. All new work (one feature or fix
  per branch) happens here. Open a PR back into `dev` when the feature is complete,
  tested, and the docs below are updated. CI (typecheck, lint, format, tests) must pass
  before merge.
- **`dev`** — integration branch. Always reflects the latest merged, tested work.
- **`staging`** — once a set of stages/features on `dev` is ready for release, `dev` is
  merged into `staging` for pre-release/manual QA testing.
- **`main`** — once staging testing passes, `staging` is merged into `main`. `main`
  always reflects the current released state.
- **Marketplace publish** — pushing a tag matching `vX.Y.Z` (matching the version in
  `package.json`) on `main` triggers `.github/workflows/publish.yml`, which packages
  the extension with `vsce` and publishes it to the Visual Studio Marketplace using the
  `VSCE_PAT` repository secret.

Every feature branch must:

1. Include tests for the behavior it adds (see `src/test/suite`).
2. Update `README.md` if user-facing behavior changed.
3. Add an entry under `[Unreleased]` in `CHANGELOG.md`.

## Development plan (multi-stage)

The extension is built in stages, each merged to `dev` independently via its own
feature branch(es) and PR(s). Stages with independent scopes (no shared files/data
contracts) can be worked in parallel by separate agents/contributors; stages that
depend on an earlier stage's output start once that dependency is merged to `dev`.

- **Stage 0 — Foundation** *(done)*: extension scaffold, lint/format config, test
  harness, CI, Marketplace publish-on-tag workflow, baseline docs.
- **Stage 1 — Resume data model & template** *(done)*: TypeScript types for resume
  sections (Contact, Summary, Education, Experience, Skills, Certifications,
  Projects), a workspace-level resume data file, and a "Create New Resume" command
  that scaffolds it. Depends on: Stage 0.
- **Stage 2 — Webview authoring UI** *(done)*: a webview panel with per-section forms
  (add/remove repeatable entries such as multiple jobs or degrees) that reads and
  writes the Stage 1 data model. Depends on: Stage 1 (data model contract).
- **Stage 3 — ATS compatibility checks** *(done)*: a rules engine that flags
  content-quality issues (missing sections, overlong/unsafe-character bullets,
  duplicate skills) and surfaces warnings live in VS Code's Problems panel. Depends
  on: Stage 1.
- **Stage 4 — Export pipeline** *(done)*: generate the resume as Markdown, HTML,
  DOCX, and PDF from the Stage 1 data model. Depends on: Stage 1.
- **Stage 5 — Integration & polish** *(done)*: end-to-end flow (create → fill →
  validate → export), command/menu wiring, extension icon and Marketplace listing
  content, `CHANGELOG.md` update for the first release. Depends on: Stages 1–4
  merged to `dev`.
- **Stage 6 — Release** *(done)*: merged `dev` → `staging` for QA, then `staging` →
  `main`, then tagged `v0.1.0` to publish.
- **Stage 7 — Edit Resume webview feedback** *(done, unreleased)*: a round of
  usability fixes to the webview editor from hands-on use, each its own feature
  branch/PR into `dev`. Depends on: Stage 6 (post-v0.1.0 feedback).
  - **7a**: sticky-header Save button, floating jump-to-top button, VS Code
    theme-colored buttons.
  - **7b**: up/down reorder controls for entries within a repeatable section.
  - **7c**: up/down reorder controls for whole sections (`sectionOrder`, respected by
    every exporter).
  - **7d**: required-field validation (Full Name, Email, Job Title/Employer,
    Institution/Degree) blocking Save, enforced in both the webview and the save
    handler.
  - **7e**: native month-picker date fields, with a "Present" checkbox for ongoing
    roles.
  - **7f**: a Bold/Italic toolbar for Highlights, using Markdown-style markup rendered
    as real bold/italic text in HTML, DOCX, and PDF exports.
  - Restyled the webview to Hired Hand's own brand colors (dark navy, orange accent)
    instead of following the editor's theme.

Stages 1, 3, and 4 depend only on the Stage 1 data model's shape (agreed up front),
not on each other's implementation, so they can be developed concurrently on separate
feature branches once that shape is settled; Stage 2 depends on the same data model.
Stage 5 starts only after Stages 1–4 are merged into `dev`. Stage 7's sub-items are
independent webview-only changes and were developed sequentially against `dev`.
