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
feature branch(es) and PR(s).

Stages 0–6 — project scaffold, the resume data model, the webview editor, ATS
compatibility checks, the export pipeline, integration polish, and the `v0.1.0`
release — are complete. See [CHANGELOG.md](./CHANGELOG.md) for what shipped in each.

Stage 7 refines the Edit Resume webview, one item per PR:

- **7a — Webview quick wins** *(done)*: a Save button in a sticky header and at the
  bottom of the form, a floating "jump to top" button, and themed button colors.
- **7b — Reorder entries within a section** *(done)*: up/down controls on each
  repeatable entry (education, experience, skills, certifications, projects).
- **7c — Reorder whole sections** *(done)*: up/down controls per section, backed by
  a `sectionOrder` field that also controls the order sections appear in every
  export.
- **7d — Required-field validation** *(in review)*: Full Name, Email, Job
  Title/Employer, and Institution/Degree are required; Save is blocked until
  they're filled in.
- **7e — Native month date picker**: a `month` input with a "Present" checkbox for
  ongoing roles, replacing the free-text date fields.
- **7f — Rich-text toolbar for Highlights**: Bold/Italic buttons that wrap selected
  text in Markdown-style `**bold**`/`*italic*`, rendered as real formatting in the
  HTML/DOCX/PDF exports.
