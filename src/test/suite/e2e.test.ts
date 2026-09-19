import * as assert from 'assert';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import { validateResumeData } from '../../resume/validate';
import { checkAtsCompatibility } from '../../resume/atsRules';
import { exportResumeToFormat } from '../../export/exportResume';
import { fullyPopulatedResume } from '../unit/fixtures';

const EXTENSION_ID = 'richardmcquiston01.hired-hand-resume-builder';

suite('End-to-end: create -> fill -> validate -> export', () => {
  setup(async () => {
    const extension = vscode.extensions.getExtension(EXTENSION_ID);
    assert.ok(extension, `${EXTENSION_ID} should be discoverable by the test host`);
    await extension!.activate();
  });

  test('a fully filled-out resume validates clean, has no ATS warnings, and exports to every format', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hired-hand-e2e-'));
    const workspaceFolder: vscode.WorkspaceFolder = {
      uri: vscode.Uri.file(tmpDir),
      name: 'e2e-workspace',
      index: 0,
    };
    const resumeUri = vscode.Uri.joinPath(workspaceFolder.uri, 'resume.json');

    try {
      // "Create": scaffold, same as the hiredHand.createResume command would write.
      const resume = fullyPopulatedResume();
      await vscode.workspace.fs.writeFile(
        resumeUri,
        Buffer.from(JSON.stringify(resume, null, 2) + '\n', 'utf8'),
      );

      // "Validate": the same checks the Problems-panel diagnostics run on save.
      const validation = validateResumeData(resume);
      assert.deepStrictEqual(validation.errors, []);
      assert.strictEqual(validation.valid, true);

      const warnings = checkAtsCompatibility(resume);
      assert.deepStrictEqual(warnings, []);

      // "Export": every format the Export Resume command offers.
      for (const extension of ['md', 'html', 'docx', 'pdf'] as const) {
        const outputUri = await exportResumeToFormat(workspaceFolder, extension);
        assert.ok(outputUri, `export to .${extension} should succeed`);
        const stat = await vscode.workspace.fs.stat(outputUri!);
        assert.ok(stat.size > 0, `.${extension} export should be non-empty`);
      }

      const files = await fs.readdir(tmpDir);
      assert.ok(files.includes('resume.md'));
      assert.ok(files.includes('resume.html'));
      assert.ok(files.includes('resume.docx'));
      assert.ok(files.includes('resume.pdf'));
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  test('exporting refuses an invalid resume.json rather than producing a broken file', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hired-hand-e2e-invalid-'));
    const workspaceFolder: vscode.WorkspaceFolder = {
      uri: vscode.Uri.file(tmpDir),
      name: 'e2e-invalid-workspace',
      index: 0,
    };
    const resumeUri = vscode.Uri.joinPath(workspaceFolder.uri, 'resume.json');

    try {
      await vscode.workspace.fs.writeFile(resumeUri, Buffer.from('{ "not": "a resume" }', 'utf8'));

      const outputUri = await exportResumeToFormat(workspaceFolder, 'md');
      assert.strictEqual(outputUri, undefined);

      const files = await fs.readdir(tmpDir);
      assert.ok(!files.includes('resume.md'));
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });
});
