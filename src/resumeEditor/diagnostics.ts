import * as vscode from 'vscode';
import { findNodeAtLocation, parseTree, type Node } from 'jsonc-parser';
import { checkAtsCompatibility } from '../resume/atsRules';
import { validateResumeData } from '../resume/validate';
import type { ResumeData } from '../resume/types';

const RESUME_FILE_NAME = 'resume.json';

export function registerAtsDiagnostics(context: vscode.ExtensionContext): void {
  const collection = vscode.languages.createDiagnosticCollection('hiredHand');
  context.subscriptions.push(collection);

  const refresh = (document: vscode.TextDocument): void => updateDiagnostics(document, collection);

  vscode.workspace.textDocuments.forEach(refresh);
  context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(refresh));
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => refresh(event.document)),
  );
  context.subscriptions.push(
    vscode.workspace.onDidCloseTextDocument((document) => collection.delete(document.uri)),
  );
}

function isResumeDocument(document: vscode.TextDocument): boolean {
  return document.uri.scheme === 'file' && document.fileName.endsWith(RESUME_FILE_NAME);
}

function updateDiagnostics(
  document: vscode.TextDocument,
  collection: vscode.DiagnosticCollection,
): void {
  if (!isResumeDocument(document)) {
    return;
  }

  const text = document.getText();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    collection.delete(document.uri);
    return;
  }

  const validation = validateResumeData(parsed);
  if (!validation.valid) {
    collection.delete(document.uri);
    return;
  }

  const resume = parsed as ResumeData;
  const warnings = checkAtsCompatibility(resume);
  const root = parseTree(text);

  const diagnostics = warnings.map((warning) => {
    const range = resolveRange(document, root, warning.path);
    const diagnostic = new vscode.Diagnostic(
      range,
      warning.message,
      vscode.DiagnosticSeverity.Warning,
    );
    diagnostic.source = 'Hired Hand ATS check';
    diagnostic.code = warning.code;
    return diagnostic;
  });

  collection.set(document.uri, diagnostics);
}

function resolveRange(
  document: vscode.TextDocument,
  root: Node | undefined,
  path: Array<string | number>,
): vscode.Range {
  const node = root ? findNodeAtLocation(root, path) : undefined;
  if (!node) {
    return new vscode.Range(0, 0, 0, 0);
  }
  return new vscode.Range(
    document.positionAt(node.offset),
    document.positionAt(node.offset + node.length),
  );
}
