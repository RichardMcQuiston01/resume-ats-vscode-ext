import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Hired Hand extension', () => {
  test('registers the createResume command', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes('hiredHand.createResume'),
      'hiredHand.createResume should be registered on activation',
    );
  });

  test('createResume command runs without throwing', async () => {
    await assert.doesNotReject(() =>
      Promise.resolve(vscode.commands.executeCommand('hiredHand.createResume')),
    );
  });
});
