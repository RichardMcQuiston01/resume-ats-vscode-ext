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
- **Stage 1 — Resume data model & template**: TypeScript types for resume sections
  (Contact, Summary, Education, Experience, Skills, Certifications, Projects), a
  workspace-level resume data file, and a "Create New Resume" command that scaffolds
  it. Depends on: Stage 0.
- **Stage 2 — Webview authoring UI**: a webview panel with per-section forms
  (add/remove repeatable entries such as multiple jobs or degrees) that reads and
  writes the Stage 1 data model. Depends on: Stage 1 (data model contract).
- **Stage 3 — ATS compatibility checks**: a rules engine that flags
  non-ATS-friendly content (tables, images, multi-column layout, non-standard section
  headers) and surfaces warnings in VS Code. Depends on: Stage 1.
- **Stage 4 — Export pipeline**: generate the resume as Markdown, HTML, DOCX, and PDF
  from the Stage 1 data model. Depends on: Stage 1.
- **Stage 5 — Integration & polish**: end-to-end flow (create → fill → validate →
  export), command/menu wiring, extension icon and Marketplace listing content,
  `CHANGELOG.md` update for the first release. Depends on: Stages 1–4 merged to `dev`.
- **Stage 6 — Release**: merge `dev` → `staging` for QA, then `staging` → `main`, then
  tag `v0.1.0` to publish.

Stages 1, 3, and 4 depend only on the Stage 1 data model's shape (agreed up front),
not on each other's implementation, so they can be developed concurrently on separate
feature branches once that shape is settled; Stage 2 depends on the same data model.
Stage 5 starts only after Stages 1–4 are merged into `dev`.
