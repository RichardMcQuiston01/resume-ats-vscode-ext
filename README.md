# Hired Hand: Resume Builder

## Overview

A Visual Studio Code extension for building an ATS-compatible resume without leaving
the editor. Fill out a structured template — Contact, Summary, Education, Experience,
Skills, Certifications, Projects — through a form-based editor, get live compatibility
warnings as you go, and export to Markdown, HTML, DOCX, or PDF.

## Features

- **Create New Resume** — scaffolds a `resume.json` in your workspace from a clean
  template.
- **Edit Resume** — a webview form editor, styled to match Hired Hand's branding, with:
  - add/remove/reorder controls for repeatable entries (multiple jobs, degrees, skill
    groups, and so on) and for whole sections.
  - required-field validation (Full Name, Email, Job Title/Employer,
    Institution/Degree) that blocks Save and names the first missing field until fixed.
  - native month-picker fields for graduation, start/end, and issue dates, with a
    "Present" checkbox for ongoing roles.
  - a Bold/Italic toolbar for Highlights bullets, using Markdown-style formatting that
    carries through to every exported format.
  - a Save button in a sticky header and a floating jump-to-top button, for quick
    editing of long resumes.
- **Live ATS compatibility checks** — missing contact info, empty sections, overlong
  or special-character-laden bullet points, and duplicate skills are flagged in the
  Problems panel as you edit.
- **Export Resume** — one command, four formats: Markdown, HTML, DOCX, and PDF, all
  single-column with no tables or images, so the layout an ATS parser sees matches
  what you built. Bold/italic Highlights formatting renders as real bold/italic text
  in every format. HTML, DOCX, and PDF exports can be tuned for the people who will
  read them (font, text size, spacing, margins, paper size) from VS Code settings,
  without giving up ATS-friendly structure.

## Status

This extension is in active development — see [CHANGELOG.md](./CHANGELOG.md) for
what has shipped so far and [CONTRIBUTING.md](./CONTRIBUTING.md) for the development
plan and branch workflow.

## Getting Started

### Prerequisites

- [Visual Studio Code](https://code.visualstudio.com/) 1.85 or later
- [Node.js](https://nodejs.org/) 20.x and npm

### Installation

Not yet published to the Marketplace. To try it from source:

```bash
git clone https://github.com/RichardMcQuiston01/resume-ats-vscode-ext.git
cd resume-ats-vscode-ext
npm install
npm run build
```

Then open the folder in VS Code and press `F5` to launch an Extension Development Host.

### Usage

1. Open a folder or workspace in VS Code.
2. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`).
3. Run **Hired Hand: Create New Resume** to scaffold a `resume.json` in the workspace
   root (or open it, if one already exists).
4. Run **Hired Hand: Edit Resume** to fill it out in a form-based webview editor, with
   add/remove controls for repeatable sections (education, experience, skills,
   certifications, projects). Saving validates the data before writing it back to
   `resume.json`. While `resume.json` is open, ATS compatibility warnings appear live
   in the **Problems** panel, updating as you edit.
5. Run **Hired Hand: Export Resume** and pick a format — Markdown, HTML, DOCX, or
   PDF. The export is written alongside `resume.json` (e.g. `resume.pdf`).

The **Edit Resume** and **Export Resume** commands are also available as toolbar
buttons in the editor title bar whenever `resume.json` is the active file.

### Customizing exports

An ATS reads your resume first, then a person does, so the HTML, DOCX, and PDF exports
can be tuned for readability. Open **Settings** and search for `hiredHand.export`.

| Setting                            | What it changes                                                                | Allowed                             |
| ---------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------- |
| `preset`                           | Overall look: `classic` (the default), `compact`, `standard`, or `comfortable` | those four                          |
| `fontFamily`                       | `sans-serif` (Arial/Helvetica), `serif` (Times), or `monospace` (Courier)      | those three                         |
| `fontSize`                         | Body text, in points                                                           | 8 to 16                             |
| `nameFontSize` / `headingFontSize` | Your name and section headings, in points                                      | 12 to 36 / 8 to 18                  |
| `lineSpacing`                      | Line height as a multiple of the font size                                     | 1 to 2                              |
| `sectionSpacing` / `entrySpacing`  | Space above section headings / between entries, in points                      | 0 to 36 / 0 to 24                   |
| `margin`                           | Page margin on all four sides, in points (72 = 1 inch)                         | 18 to 108                           |
| `pageSize`                         | `letter` or `a4` (PDF and Word)                                                | those two                           |
| `headingCase`                      | `upper` (SECTION) or `title` (Section)                                         | those two                           |
| `projectLinks`                     | Where a project's links (URL, repository, demo) go                             | `below` (default), `heading`, `off` |
| `projectTechStack`                 | Where a project's tech stack goes                                              | `off` (default), `heading`, `below` |
| `projectOutcome`                   | Whether a project's outcome is printed (on its own line)                       | `off` (default), `below`            |
| `credentialUrl`                    | Where a certification's credential URL goes                                    | `off` (default), `heading`, `below` |

Leave a setting empty to use the preset's value; set one to override just that part.
Markdown exports have no layout, so the style settings do not apply to them. A Markdown export
simply lists everything you entered for each project and certification.

**ATS safety is built in.** Settings can only change how the page looks, never its
structure: the exports stay a single column of real text with real headings, in fonts
every ATS, PDF reader, and Word install has. A value outside its range is ignored, and
the export tells you which setting and why, instead of failing. If a choice is allowed
but hard on human readers (body text under 10 pt, tight line spacing, very narrow
margins), the export still succeeds and adds a short note.

### Project and certification details

Besides a name and description, a project can have a **URL**, a **repository URL**, a **demo URL**,
a **tech stack**, and an **outcome** (the result or impact, for example "Cut reconciliation from 2
days to 2 hours."), and a certification can have a **credential URL** (a Credly or issuer page that
verifies it). Fill them in from **Edit Resume**, or add them to `resume.json`:

```json
{
  "certifications": [
    {
      "name": "AWS Certified Solutions Architect",
      "issuer": "AWS",
      "issueDate": "2023-05",
      "credentialUrl": "https://verify.example.com/cert/42"
    }
  ],
  "projects": [
    {
      "name": "Ledger",
      "description": "Reconciliation tool.",
      "url": "https://ledger.example.com",
      "repoUrl": "https://github.com/example/ledger",
      "demoUrl": "https://demo.example.com",
      "techStack": ["Go", "PostgreSQL"],
      "outcome": "Cut reconciliation from 2 days to 2 hours.",
      "highlights": []
    }
  ]
}
```

The HTML, Word, and PDF exports print the links by default (see `projectLinks`) and leave the rest
out until you turn them on with the settings above. A `resume.json` saved by an earlier version,
without these fields, keeps working unchanged.

### Examples

```json
{
  "schemaVersion": 1,
  "contact": {
    "fullName": "",
    "email": "",
    "phone": "",
    "location": "",
    "linkedInUrl": "",
    "portfolioUrl": ""
  },
  "summary": "",
  "education": [],
  "experience": [],
  "skills": [],
  "certifications": [],
  "projects": []
}
```

## Buy Me a Coffee

If this app, code, or repository has helped you or someone you know, please consider donating. I appreciate any help to offset the costs of development and/or AI Credits.

[**Donate via Stripe**](https://donate.stripe.com/00w5kD3Gj1Xo9v7gVOcs800), or scan:

[![Donate via Stripe](./donate.png)](https://donate.stripe.com/00w5kD3Gj1Xo9v7gVOcs800)

## License

Apache 2

## Copyright

(c)2026 Richard McQuiston. All rights reserved.
