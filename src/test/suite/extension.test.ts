import * as assert from 'assert';
import * as vscode from 'vscode';

const EXTENSION_ID = 'richardmcquiston01.hired-hand-resume-builder';

suite('Hired Hand extension', () => {
  setup(async () => {
    const extension = vscode.extensions.getExtension(EXTENSION_ID);
    assert.ok(extension, `${EXTENSION_ID} should be discoverable by the test host`);
    await extension!.activate();
  });

  test('registers the createResume and editResume commands', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes('hiredHand.createResume'),
      'hiredHand.createResume should be registered on activation',
    );
    assert.ok(
      commands.includes('hiredHand.editResume'),
      'hiredHand.editResume should be registered on activation',
    );
  });

  test('createResume command runs without throwing', async () => {
    await assert.doesNotReject(() =>
      Promise.resolve(vscode.commands.executeCommand('hiredHand.createResume')),
    );
  });

  test('editResume command runs without throwing', async () => {
    await assert.doesNotReject(() =>
      Promise.resolve(vscode.commands.executeCommand('hiredHand.editResume')),
    );
  });
});
