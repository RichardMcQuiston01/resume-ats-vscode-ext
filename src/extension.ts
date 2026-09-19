import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext): void {
  const createResumeCommand = vscode.commands.registerCommand('hiredHand.createResume', () => {
    void vscode.window.showInformationMessage('Hired Hand: resume creation is coming soon.');
  });

  context.subscriptions.push(createResumeCommand);
}

export function deactivate(): void {
  // No teardown work required yet.
}
