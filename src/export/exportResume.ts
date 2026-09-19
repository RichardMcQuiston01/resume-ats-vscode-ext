import * as vscode from 'vscode';
import { validateResumeData } from '../resume/validate';
import type { ResumeData } from '../resume/types';
import { resumeToMarkdown } from './toMarkdown';
import { resumeToHtml } from './toHtml';
import { resumeToDocxBuffer } from './toDocx';
import { resumeToPdfBuffer } from './toPdf';

const RESUME_FILE_NAME = 'resume.json';

export type ExportExtension = 'md' | 'html' | 'docx' | 'pdf';

interface ExportFormat {
  label: string;
  extension: ExportExtension;
  generate: (resume: ResumeData) => string | Promise<Buffer>;
}

const FORMATS: ExportFormat[] = [
  { label: 'Markdown (.md)', extension: 'md', generate: resumeToMarkdown },
  { label: 'HTML (.html)', extension: 'html', generate: resumeToHtml },
  { label: 'Word document (.docx)', extension: 'docx', generate: resumeToDocxBuffer },
  { label: 'PDF (.pdf)', extension: 'pdf', generate: resumeToPdfBuffer },
];

async function readResume(resumeUri: vscode.Uri): Promise<ResumeData | undefined> {
  let parsed: unknown;
  try {
    const bytes = await vscode.workspace.fs.readFile(resumeUri);
    parsed = JSON.parse(Buffer.from(bytes).toString('utf8'));
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    void vscode.window.showErrorMessage(
      `Hired Hand: could not read ${RESUME_FILE_NAME} (${reason}). Run "Hired Hand: Create New Resume" first.`,
    );
    return undefined;
  }

  const result = validateResumeData(parsed);
  if (!result.valid) {
    void vscode.window.showErrorMessage(
      `Hired Hand: ${RESUME_FILE_NAME} is invalid (${result.errors[0]}). Fix it before exporting.`,
    );
    return undefined;
  }

  return parsed as ResumeData;
}

async function performExport(
  workspaceFolder: vscode.WorkspaceFolder,
  resume: ResumeData,
  format: ExportFormat,
): Promise<vscode.Uri | undefined> {
  const outputUri = vscode.Uri.joinPath(workspaceFolder.uri, `resume.${format.extension}`);
  try {
    const content = await format.generate(resume);
    const bytes = typeof content === 'string' ? Buffer.from(content, 'utf8') : content;
    await vscode.workspace.fs.writeFile(outputUri, bytes);
    return outputUri;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    void vscode.window.showErrorMessage(`Hired Hand: failed to export resume: ${reason}`);
    return undefined;
  }
}

/**
 * Non-interactive export core: reads/validates resume.json and writes the given
 * format, with no QuickPick or notification prompt. Used directly by tests, and by
 * exportResume() below once a format has been picked.
 */
export async function exportResumeToFormat(
  workspaceFolder: vscode.WorkspaceFolder,
  extension: ExportExtension,
): Promise<vscode.Uri | undefined> {
  const resumeUri = vscode.Uri.joinPath(workspaceFolder.uri, RESUME_FILE_NAME);
  const resume = await readResume(resumeUri);
  if (!resume) {
    return undefined;
  }

  const format = FORMATS.find((candidate) => candidate.extension === extension);
  if (!format) {
    throw new Error(`Unknown export format: ${extension}`);
  }

  return performExport(workspaceFolder, resume, format);
}

export async function exportResume(workspaceFolder: vscode.WorkspaceFolder): Promise<void> {
  const resumeUri = vscode.Uri.joinPath(workspaceFolder.uri, RESUME_FILE_NAME);
  const resume = await readResume(resumeUri);
  if (!resume) {
    return;
  }

  const picked = await vscode.window.showQuickPick(
    FORMATS.map((format) => format.label),
    { placeHolder: 'Export resume as…' },
  );
  if (!picked) {
    return;
  }
  const format = FORMATS.find((candidate) => candidate.label === picked);
  if (!format) {
    return;
  }

  const outputUri = await performExport(workspaceFolder, resume, format);
  if (!outputUri) {
    return;
  }

  const reveal = 'Reveal in Explorer';
  const selection = await vscode.window.showInformationMessage(
    `Hired Hand: exported ${outputUri.fsPath}`,
    reveal,
  );
  if (selection === reveal) {
    await vscode.commands.executeCommand('revealFileInOS', outputUri);
  }
}
