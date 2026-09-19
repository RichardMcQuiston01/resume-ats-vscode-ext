import * as vscode from 'vscode';
import { createDefaultResume } from './resume/template';
import { ResumeEditorPanel } from './resumeEditor/panel';

const RESUME_FILE_NAME = 'resume.json';

async function createResume(): Promise<void> {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    void vscode.window.showErrorMessage(
      'Hired Hand: open a folder or workspace before creating a resume.',
    );
    return;
  }

  const resumeUri = vscode.Uri.joinPath(workspaceFolder.uri, RESUME_FILE_NAME);

  const alreadyExists = await fileExists(resumeUri);
  if (!alreadyExists) {
    const defaultResume = createDefaultResume();
    const contents = Buffer.from(JSON.stringify(defaultResume, null, 2) + '\n', 'utf8');
    try {
      await vscode.workspace.fs.writeFile(resumeUri, contents);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      void vscode.window.showErrorMessage(
        `Hired Hand: failed to create ${RESUME_FILE_NAME}: ${reason}`,
      );
      return;
    }
  }

  const document = await vscode.workspace.openTextDocument(resumeUri);
  await vscode.window.showTextDocument(document);
}

async function fileExists(uri: vscode.Uri): Promise<boolean> {
  try {
    await vscode.workspace.fs.stat(uri);
    return true;
  } catch {
    return false;
  }
}

async function editResume(extensionUri: vscode.Uri): Promise<void> {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    void vscode.window.showErrorMessage(
      'Hired Hand: open a folder or workspace before editing a resume.',
    );
    return;
  }

  await ResumeEditorPanel.createOrShow(extensionUri, workspaceFolder);
}

export function activate(context: vscode.ExtensionContext): void {
  const createResumeCommand = vscode.commands.registerCommand('hiredHand.createResume', () => {
    void createResume();
  });
  const editResumeCommand = vscode.commands.registerCommand('hiredHand.editResume', () => {
    void editResume(context.extensionUri);
  });

  context.subscriptions.push(createResumeCommand, editResumeCommand);
}

export function deactivate(): void {
  // No teardown work required yet.
}
