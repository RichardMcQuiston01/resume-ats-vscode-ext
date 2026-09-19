import * as assert from 'assert';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import { createDefaultResume } from '../../resume/template';

const EXTENSION_ID = 'richardmcquiston01.hired-hand-resume-builder';

suite('ATS diagnostics', () => {
  setup(async () => {
    const extension = vscode.extensions.getExtension(EXTENSION_ID);
    assert.ok(extension, `${EXTENSION_ID} should be discoverable by the test host`);
    await extension!.activate();
  });

  test('flags a blank resume.json for missing contact info, summary, experience, and skills', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hired-hand-'));
    const resumePath = path.join(tmpDir, 'resume.json');
    await fs.writeFile(resumePath, JSON.stringify(createDefaultResume(), null, 2), 'utf8');
    const resumeUri = vscode.Uri.file(resumePath);

    try {
      await vscode.workspace.openTextDocument(resumeUri);
      await new Promise((resolve) => setTimeout(resolve, 200));

      const diagnostics = vscode.languages.getDiagnostics(resumeUri);
      const codes = diagnostics.map((diagnostic) => diagnostic.code);

      assert.ok(codes.includes('missing-email'));
      assert.ok(codes.includes('missing-phone'));
      assert.ok(codes.includes('missing-summary'));
      assert.ok(codes.includes('no-experience'));
      assert.ok(codes.includes('no-skills'));
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  test('does not flag a JSON file that is not named resume.json', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hired-hand-'));
    const otherPath = path.join(tmpDir, 'other.json');
    await fs.writeFile(otherPath, JSON.stringify(createDefaultResume(), null, 2), 'utf8');
    const otherUri = vscode.Uri.file(otherPath);

    try {
      await vscode.workspace.openTextDocument(otherUri);
      await new Promise((resolve) => setTimeout(resolve, 200));

      assert.deepStrictEqual(vscode.languages.getDiagnostics(otherUri), []);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });
});
