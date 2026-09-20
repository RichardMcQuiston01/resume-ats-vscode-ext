import * as vscode from 'vscode';
import { createDefaultResume } from '../resume/template';
import { validateResumeData } from '../resume/validate';
import { getRequiredFieldErrors } from '../resume/requiredFields';
import type { ResumeData } from '../resume/types';
import type { ExtensionToWebviewMessage, WebviewToExtensionMessage } from './messages';
import { getWebviewHtml } from './webviewContent';

const RESUME_FILE_NAME = 'resume.json';
const VIEW_TYPE = 'hiredHand.resumeEditor';

export class ResumeEditorPanel {
  private static current: ResumeEditorPanel | undefined;

  private readonly panel: vscode.WebviewPanel;
  private readonly resumeUri: vscode.Uri;
  private readonly disposables: vscode.Disposable[] = [];

  static async createOrShow(
    extensionUri: vscode.Uri,
    workspaceFolder: vscode.WorkspaceFolder,
  ): Promise<void> {
    if (ResumeEditorPanel.current) {
      ResumeEditorPanel.current.panel.reveal();
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      VIEW_TYPE,
      'Hired Hand: Edit Resume',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'dist')],
      },
    );

    const created = new ResumeEditorPanel(panel, extensionUri, workspaceFolder);
    ResumeEditorPanel.current = created;
    await created.loadAndRender();
  }

  private constructor(
    panel: vscode.WebviewPanel,
    private readonly extensionUri: vscode.Uri,
    workspaceFolder: vscode.WorkspaceFolder,
  ) {
    this.panel = panel;
    this.resumeUri = vscode.Uri.joinPath(workspaceFolder.uri, RESUME_FILE_NAME);

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    this.panel.webview.onDidReceiveMessage(
      (message: WebviewToExtensionMessage) => void this.handleMessage(message),
      null,
      this.disposables,
    );
  }

  private async loadAndRender(): Promise<void> {
    const resume = await this.readResume();
    this.panel.webview.html = getWebviewHtml(this.panel.webview, this.extensionUri);
    this.post({ type: 'load', resume });
  }

  private async readResume(): Promise<ResumeData> {
    try {
      const bytes = await vscode.workspace.fs.readFile(this.resumeUri);
      const parsed: unknown = JSON.parse(Buffer.from(bytes).toString('utf8'));
      const result = validateResumeData(parsed);
      if (result.valid) {
        return parsed as ResumeData;
      }
      void vscode.window.showWarningMessage(
        `Hired Hand: ${RESUME_FILE_NAME} is invalid (${result.errors[0]}); starting from a blank resume.`,
      );
      return createDefaultResume();
    } catch {
      return createDefaultResume();
    }
  }

  private async handleMessage(message: WebviewToExtensionMessage): Promise<void> {
    if (message.type !== 'saveRequest') {
      return;
    }

    const result = validateResumeData(message.resume);
    if (!result.valid) {
      this.post({ type: 'saveError', errors: result.errors });
      return;
    }

    const requiredFieldErrors = getRequiredFieldErrors(message.resume);
    if (requiredFieldErrors.length > 0) {
      this.post({
        type: 'saveError',
        errors: requiredFieldErrors.map((error) => error.message),
      });
      return;
    }

    try {
      const contents = Buffer.from(JSON.stringify(message.resume, null, 2) + '\n', 'utf8');
      await vscode.workspace.fs.writeFile(this.resumeUri, contents);
      this.post({ type: 'saved' });
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.post({
        type: 'saveError',
        errors: [`failed to write ${RESUME_FILE_NAME}: ${reason}`],
      });
    }
  }

  private post(message: ExtensionToWebviewMessage): void {
    void this.panel.webview.postMessage(message);
  }

  private dispose(): void {
    ResumeEditorPanel.current = undefined;
    while (this.disposables.length > 0) {
      this.disposables.pop()?.dispose();
    }
    this.panel.dispose();
  }
}
