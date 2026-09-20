import * as vscode from 'vscode';

function getNonce(): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let text = '';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

function section(id: string, legend: string, addLabel: string): string {
  return `
  <fieldset>
    <legend>${legend}</legend>
    <div id="${id}-list"></div>
    <button type="button" id="${id}-add">${addLabel}</button>
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
    body {
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
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
      background: var(--vscode-editor-background);
      padding: 12px 16px;
      margin: 0 -16px 8px;
      border-bottom: 1px solid var(--vscode-panel-border);
    }
    #header-bar h1 {
      margin: 0;
      font-size: 1.2em;
    }
    fieldset {
      margin-bottom: 16px;
      border: 1px solid var(--vscode-panel-border);
    }
    label {
      display: block;
      margin-bottom: 8px;
    }
    input[type='text'],
    input[type='month'],
    textarea {
      width: 100%;
      box-sizing: border-box;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border);
      padding: 4px;
    }
    .entry {
      border-top: 1px solid var(--vscode-panel-border);
      padding-top: 8px;
      margin-top: 8px;
    }
    button {
      margin-top: 8px;
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
      border: 1px solid var(--vscode-button-border, transparent);
      border-radius: 2px;
      padding: 4px 12px;
      cursor: pointer;
    }
    button:hover {
      background: var(--vscode-button-secondaryHoverBackground);
    }
    button:disabled {
      opacity: 0.4;
      cursor: default;
    }
    .entry-controls {
      display: flex;
      gap: 4px;
    }
    .entry-controls button {
      margin-top: 0;
    }
    button.save-button {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      font-weight: bold;
    }
    button.save-button:hover {
      background: var(--vscode-button-hoverBackground);
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
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
    }
  </style>
</head>
<body>
  <div id="header-bar">
    <h1>Hired Hand: Edit Resume</h1>
    <button type="button" id="save-top" class="save-button">Save</button>
  </div>
  <div id="root">
    <p id="status" aria-live="polite"></p>

    <fieldset>
      <legend>Contact</legend>
      <label>Full name<input id="contact-fullName" type="text" /></label>
      <label>Email<input id="contact-email" type="text" /></label>
      <label>Phone<input id="contact-phone" type="text" /></label>
      <label>Location<input id="contact-location" type="text" /></label>
      <label>LinkedIn URL<input id="contact-linkedInUrl" type="text" /></label>
      <label>Portfolio URL<input id="contact-portfolioUrl" type="text" /></label>
    </fieldset>

    <fieldset>
      <legend>Summary</legend>
      <textarea id="summary" rows="4"></textarea>
    </fieldset>

    ${section('education', 'Education', 'Add Education')}
    ${section('experience', 'Experience', 'Add Experience')}
    ${section('skills', 'Skills', 'Add Skill Group')}
    ${section('certifications', 'Certifications', 'Add Certification')}
    ${section('projects', 'Projects', 'Add Project')}

    <button type="button" id="save-bottom" class="save-button">Save</button>
  </div>
  <button type="button" id="jump-to-top" title="Jump to top" aria-label="Jump to top">&uarr;</button>
  <script nonce="${nonce}" src="${scriptUri.toString()}"></script>
</body>
</html>`;
}
