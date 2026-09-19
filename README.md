# Hired Hand:  Resume Builder

## Overview

Visual Studio Code Extension for creating an ATS compatible resume. Extension is able to output a template, which is then filled out by the user inputting information for various setions(Education, Experience, etc.).

## Status

This extension is in early, active development. The scaffold, test harness, CI, and
Marketplace publish pipeline are in place; resume-building features are being added
incrementally — see [CHANGELOG.md](./CHANGELOG.md) for what has shipped so far and
[CONTRIBUTING.md](./CONTRIBUTING.md) for the development plan and branch workflow.

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

1. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`).
2. Run **Hired Hand: Create New Resume**.

The command currently shows a placeholder message; the resume-authoring webview and
ATS-compatible export pipeline are being built out per the plan in
[CONTRIBUTING.md](./CONTRIBUTING.md).

### Examples

Coming soon once the template and export features land.

## Buy Me a Coffee

If this app, code, or repository has helped you or someone you know, please consider donating. I appreciate any help to offset the costs of development and/or AI Credits.

[**Donate via Stripe**](https://donate.stripe.com/00w5kD3Gj1Xo9v7gVOcs800), or scan:

[![Donate via Stripe](./donate.svg)](https://donate.stripe.com/00w5kD3Gj1Xo9v7gVOcs800)

## License

Apache 2

## Copyright

(c)2026 Richard McQuiston.  All rights reserved.
