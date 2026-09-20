# Hired Hand: Resume Builder

## Overview

A Visual Studio Code extension for building an ATS-compatible resume without leaving
the editor. Fill out a structured template — Contact, Summary, Education, Experience,
Skills, Certifications, Projects — through a form-based editor, get live compatibility
warnings as you go, and export to Markdown, HTML, DOCX, or PDF.

## Features

- **Create New Resume** — scaffolds a `resume.json` in your workspace from a clean
  template.
- **Edit Resume** — a webview form editor with add/remove controls for repeatable
  sections (multiple jobs, degrees, skill groups, and so on), up/down controls to
  reorder both entries and whole sections, and required-field validation that blocks
  Save until the essentials are filled in.
- **Live ATS compatibility checks** — missing contact info, empty sections, overlong
  or special-character-laden bullet points, and duplicate skills are flagged in the
  Problems panel as you edit.
- **Export Resume** — one command, four formats: Markdown, HTML, DOCX, and PDF, all
  single-column with no tables or images, so the layout an ATS parser sees matches
  what you built.

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
4. Run **Hired Hand: Edit Resume** to open the form-based webview editor:
   - **Add / remove entries** — each repeatable section (Education, Experience,
     Skills, Certifications, Projects) has its own "Add" button and a "Remove"
     button per entry.
   - **Reorder entries within a section** — use the ▲/▼ buttons next to Remove to
     change the order entries appear in, e.g. to put your most recent job first.
   - **Reorder whole sections** — use the ▲/▼ buttons in a section's header to
     change which section comes first. This order also controls the order sections
     appear in every exported file.
   - **Required fields** — Full Name and Email (Contact), Job Title and Employer
     (each Experience entry), and Institution and Degree (each Education entry) are
     marked with `*`. A blank required field is outlined in red, and Save stays
     disabled — with a message naming the first missing field — until it's filled
     in, so an incomplete resume can't be saved.
   - **Save** — available both in the sticky header and at the bottom of the form;
     either one saves the same data. A floating "jump to top" button in the
     bottom-right corner scrolls back to the header.
   - While `resume.json` is open, ATS compatibility warnings appear live in the
     **Problems** panel, updating as you edit.
5. Run **Hired Hand: Export Resume** and pick a format — Markdown, HTML, DOCX, or
   PDF. The export is written alongside `resume.json` (e.g. `resume.pdf`), with
   sections in the order you set in the editor.

The **Edit Resume** and **Export Resume** commands are also available as toolbar
buttons in the editor title bar whenever `resume.json` is the active file.

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

(c)2026 Richard McQuiston.  All rights reserved.
