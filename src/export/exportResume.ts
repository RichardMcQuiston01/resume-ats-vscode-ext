import * as vscode from 'vscode';
import { normalizeResumeData, validateResumeData } from '../resume/validate';
import type { ResumeData } from '../resume/types';
import type { PackageExportOptions } from './packageExporters';
import { resumeToMarkdown } from './toMarkdown';
import { resumeToDocxBuffer, resumeToHtml, resumeToPdfBuffer } from './packageExporters';
import {
  EXPORT_SETTINGS_SECTION,
  resolveExportSettings,
  type ExportSettingValues,
  type ResolvedExportSettings,
} from './exportStyle';

const RESUME_FILE_NAME = 'resume.json';

export type ExportExtension = 'md' | 'html' | 'docx' | 'pdf';

interface ExportFormat {
  label: string;
  extension: ExportExtension;
  /** Whether the export style settings (font, spacing, margins, ...) apply to this format. */
  usesStyle: boolean;
  generate: (resume: ResumeData, options: PackageExportOptions) => string | Promise<Buffer>;
}

const FORMATS: ExportFormat[] = [
  {
    label: 'Markdown (.md)',
    extension: 'md',
    usesStyle: false,
    generate: (resume) => resumeToMarkdown(resume),
  },
  {
    label: 'HTML (.html)',
    extension: 'html',
    usesStyle: true,
    generate: (resume, options) => resumeToHtml(resume, options.style, options.details),
  },
  {
    label: 'Word document (.docx)',
    extension: 'docx',
    usesStyle: true,
    generate: (resume, options) => resumeToDocxBuffer(resume, options.style, options.details),
  },
  {
    label: 'PDF (.pdf)',
    extension: 'pdf',
    usesStyle: true,
    generate: (resume, options) => resumeToPdfBuffer(resume, options.style, options.details),
  },
];

/** Reads the `hiredHand.export.*` settings for this workspace folder and resolves them to a valid style. */
function loadExportSettings(workspaceFolder: vscode.WorkspaceFolder): ResolvedExportSettings {
  const config = vscode.workspace.getConfiguration(EXPORT_SETTINGS_SECTION, workspaceFolder.uri);
  const values: ExportSettingValues = {
    preset: config.get<string>('preset'),
    fontFamily: config.get<string>('fontFamily'),
    fontSize: config.get<number | null>('fontSize'),
    nameFontSize: config.get<number | null>('nameFontSize'),
    headingFontSize: config.get<number | null>('headingFontSize'),
    lineSpacing: config.get<number | null>('lineSpacing'),
    sectionSpacing: config.get<number | null>('sectionSpacing'),
    entrySpacing: config.get<number | null>('entrySpacing'),
    margin: config.get<number | null>('margin'),
    pageSize: config.get<string>('pageSize'),
    projectLinks: config.get<string>('projectLinks'),
    projectTechStack: config.get<string>('projectTechStack'),
    projectOutcome: config.get<string>('projectOutcome'),
    credentialUrl: config.get<string>('credentialUrl'),
    headingCase: config.get<string>('headingCase'),
  };
  return resolveExportSettings(values);
}

/** The options handed to an exporter; formats that ignore the settings get the built-in look. */
function exportOptionsFor(settings: ResolvedExportSettings | undefined): PackageExportOptions {
  return settings ? { style: settings.style, details: settings.details } : { style: 'standard' };
}

/** Tells the user about settings that were ignored, without blocking the export. */
function reportIgnoredSettings(problems: string[]): void {
  if (problems.length > 0) {
    void vscode.window.showWarningMessage(
      `Hired Hand: some export settings were ignored. ${problems.join(' ')}`,
    );
  }
}

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

  return normalizeResumeData(parsed as ResumeData);
}

async function performExport(
  workspaceFolder: vscode.WorkspaceFolder,
  resume: ResumeData,
  format: ExportFormat,
  options: PackageExportOptions,
): Promise<vscode.Uri | undefined> {
  const outputUri = vscode.Uri.joinPath(workspaceFolder.uri, `resume.${format.extension}`);
  try {
    const content = await format.generate(resume, options);
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

  const settings = format.usesStyle ? loadExportSettings(workspaceFolder) : undefined;
  if (settings) {
    reportIgnoredSettings(settings.problems);
  }
  return performExport(workspaceFolder, resume, format, exportOptionsFor(settings));
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

  const settings = format.usesStyle ? loadExportSettings(workspaceFolder) : undefined;
  if (settings) {
    reportIgnoredSettings(settings.problems);
  }

  const outputUri = await performExport(
    workspaceFolder,
    resume,
    format,
    exportOptionsFor(settings),
  );
  if (!outputUri) {
    return;
  }

  const note = settings && settings.warnings.length > 0 ? `. Note: ${settings.warnings[0]}` : '';
  const reveal = 'Reveal in Explorer';
  const selection = await vscode.window.showInformationMessage(
    `Hired Hand: exported ${outputUri.fsPath}${note}`,
    reveal,
  );
  if (selection === reveal) {
    await vscode.commands.executeCommand('revealFileInOS', outputUri);
  }
}
