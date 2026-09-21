import * as vscode from 'vscode';

function getNonce(): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let text = '';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

// Inline SVGs (currentColor stroke) instead of an icon font: the webview's CSP has no
// font-src/img-src, so anything else would mean loosening it for a handful of glyphs.
const PLUS_ICON =
  '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M8 2.5v11M2.5 8h11"/></svg>';
const SAVE_ICON =
  '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"><path d="M2 2h9l3 3v9a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z"/><path d="M4.5 2v3.5h5V2"/><path d="M3.5 9.5h9V15h-9z"/></svg>';

function section(id: string, legend: string, addLabel: string): string {
  return `
  <fieldset id="section-${id}">
    <legend>
      <span>${legend}</span>
      <span class="section-controls">
        <button type="button" id="${id}-move-up" title="Move section up" aria-label="Move ${legend} section up">&#9650;</button>
        <button type="button" id="${id}-move-down" title="Move section down" aria-label="Move ${legend} section down">&#9660;</button>
      </span>
    </legend>
    <div id="${id}-list"></div>
    <button type="button" id="${id}-add">${PLUS_ICON}<span>${addLabel}</span></button>
  </fieldset>`;
}

export function getWebviewHtml(webview: vscode.Webview, extensionUri: vscode.Uri): string {
  const nonce = getNonce();
  const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'dist', 'webview.js'));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta
    http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';"
  />
  <title>Hired Hand: Edit Resume</title>
  <style nonce="${nonce}">
    :root {
      /* Hired Hand brand palette — matches the other Hired Hand products
         (dark navy chrome, orange accent) rather than the editor theme. */
      --hh-bg: #10303f;
      --hh-bg-header: #0b222c;
      --hh-panel-bg: #15394a;
      --hh-legend-bg: #1d4e62;
      --hh-border: #24576b;
      --hh-text: #dce7ec;
      --hh-text-strong: #ffffff;
      --hh-text-muted: #9fb8c3;
      --hh-orange: #f0801e;
      --hh-orange-hover: #d96f14;
      --hh-input-bg: #ffffff;
      --hh-input-text: #10303f;
      --hh-input-border: #c7d3d8;
      --hh-error: #e5484d;
      --hh-warning: #f2c94c;
    }
    body {
      font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif);
      background: var(--hh-bg);
      color: var(--hh-text);
      padding: 0 16px 32px;
      margin: 0;
    }
    #header-bar {
      position: sticky;
      top: 0;
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      background: var(--hh-bg-header);
      padding: 12px 16px;
      margin: 0 -16px 16px;
      border-bottom: 2px solid var(--hh-orange);
    }
    #header-bar h1 {
      margin: 0;
      font-size: 1.1em;
      color: var(--hh-text-strong);
      letter-spacing: 0.03em;
      text-transform: uppercase;
    }
    fieldset {
      margin-bottom: 16px;
      border: 1px solid var(--hh-border);
      border-radius: 4px;
      background: var(--hh-panel-bg);
      padding: 0 12px 12px;
    }
    legend {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: calc(100% + 24px);
      margin: 0 -12px 12px;
      padding: 8px 12px;
      background: var(--hh-legend-bg);
      color: var(--hh-text-strong);
      border-radius: 3px 3px 0 0;
      text-transform: uppercase;
      font-size: 0.82em;
      letter-spacing: 0.05em;
      font-weight: 600;
    }
    label {
      display: block;
      margin-bottom: 8px;
      color: var(--hh-text-muted);
      font-size: 0.9em;
    }
    .required-marker {
      color: var(--hh-orange);
      font-weight: bold;
    }
    input[type='text'],
    input[type='email'],
    input[type='tel'],
    input[type='url'],
    input[type='month'],
    textarea {
      width: 100%;
      box-sizing: border-box;
      background: var(--hh-input-bg);
      color: var(--hh-input-text);
      border: 1px solid var(--hh-input-border);
      border-radius: 3px;
      padding: 6px 8px;
      font-size: 1em;
      margin-top: 2px;
    }
    input.invalid {
      border-color: var(--hh-error);
      border-width: 2px;
    }
    input:disabled {
      opacity: 0.5;
    }
    label.present-checkbox {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--hh-text);
    }
    label.present-checkbox input {
      width: auto;
    }
    .rich-text-toolbar {
      display: flex;
      gap: 4px;
      margin-bottom: 4px;
    }
    .rich-text-toolbar button {
      margin-top: 0;
      min-width: 28px;
    }
    .rich-text-bold {
      font-weight: bold;
    }
    .rich-text-italic {
      font-style: italic;
    }
    .entry {
      border-top: 1px solid var(--hh-border);
      padding-top: 8px;
      margin-top: 8px;
    }
    button {
      margin-top: 8px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: transparent;
      color: var(--hh-text);
      border: 1px solid var(--hh-border);
      border-radius: 3px;
      padding: 4px 12px;
      cursor: pointer;
      font-family: inherit;
    }
    button svg {
      flex-shrink: 0;
    }
    button:hover {
      background: var(--hh-legend-bg);
      border-color: var(--hh-orange);
    }
    button:disabled {
      /* Explicit muted colors instead of opacity: a translucent button blends its
         orange/white with the dark page behind it into an unreadable smear. */
      opacity: 1;
      background: var(--hh-panel-bg);
      color: var(--hh-text-muted);
      border-color: var(--hh-border);
      cursor: default;
    }
    .entry-controls {
      display: flex;
      gap: 4px;
    }
    .entry-controls button {
      margin-top: 0;
    }
    .section-controls {
      display: flex;
      gap: 4px;
    }
    .section-controls button {
      margin-top: 0;
    }
    button.save-button {
      background: var(--hh-orange);
      color: #ffffff;
      border-color: var(--hh-orange);
      font-weight: bold;
    }
    button.save-button:hover {
      background: var(--hh-orange-hover);
      border-color: var(--hh-orange-hover);
    }
    button.save-button:disabled {
      background: var(--hh-panel-bg);
      color: var(--hh-text-muted);
      border-color: var(--hh-border);
    }
    .save-feedback {
      margin: 0 0 8px;
    }
    .save-feedback p {
      margin: 2px 0;
      font-size: 0.85em;
    }
    .save-feedback-error {
      color: var(--hh-error);
    }
    .save-feedback-warning {
      color: var(--hh-warning);
    }
    #jump-to-top {
      position: fixed;
      right: 24px;
      bottom: 24px;
      width: 40px;
      height: 40px;
      margin: 0;
      padding: 0;
      border-radius: 50%;
      font-size: 1.1em;
      line-height: 1;
      background: var(--hh-orange);
      color: #ffffff;
      border-color: var(--hh-orange);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
    }
    #jump-to-top:hover {
      background: var(--hh-orange-hover);
    }
  </style>
</head>
<body>
  <div id="header-bar">
    <h1>Hired Hand: Edit Resume</h1>
    <button type="button" id="save-top" class="save-button">${SAVE_ICON}<span>Save</span></button>
  </div>
  <div id="root">
    <p id="status" aria-live="polite"></p>

    <fieldset>
      <legend>Contact</legend>
      <label>Full name <span class="required-marker">*</span><input id="contact-fullName" type="text" data-required="true" /></label>
      <label>Email <span class="required-marker">*</span><input id="contact-email" type="email" data-required="true" /></label>
      <label>Phone<input id="contact-phone" type="tel" maxlength="20" /></label>
      <label>Location<input id="contact-location" type="text" /></label>
      <label>LinkedIn URL<input id="contact-linkedInUrl" type="url" /></label>
      <label>Portfolio URL<input id="contact-portfolioUrl" type="url" /></label>
    </fieldset>

    <fieldset>
      <legend>Summary</legend>
      <textarea id="summary" rows="4"></textarea>
    </fieldset>

    <div id="sections-container">
      ${section('education', 'Education', 'Add Education')}
      ${section('experience', 'Experience', 'Add Experience')}
      ${section('skills', 'Skills', 'Add Skill Group')}
      ${section('certifications', 'Certifications', 'Add Certification')}
      ${section('projects', 'Projects', 'Add Project')}
    </div>

    <div id="save-feedback" class="save-feedback" aria-live="polite"></div>
    <button type="button" id="save-bottom" class="save-button">${SAVE_ICON}<span>Save</span></button>
  </div>
  <button type="button" id="jump-to-top" title="Jump to top" aria-label="Jump to top">&uarr;</button>
  <script nonce="${nonce}" src="${scriptUri.toString()}"></script>
</body>
</html>`;
}
