import * as assert from 'assert';
import { resumeToDocxBuffer } from '../../export/toDocx';
import { createDefaultResume } from '../../resume/template';
import { fullyPopulatedResume } from './fixtures';

suite('resumeToDocxBuffer', () => {
  test('produces a non-empty ZIP-signed buffer (DOCX is a ZIP container)', async () => {
    const buffer = await resumeToDocxBuffer(fullyPopulatedResume());
    assert.ok(buffer.length > 0);
    // ZIP local file header magic number: "PK\x03\x04".
    assert.strictEqual(buffer[0], 0x50);
    assert.strictEqual(buffer[1], 0x4b);
  });

  test('succeeds for a blank default resume', async () => {
    const buffer = await resumeToDocxBuffer(createDefaultResume());
    assert.ok(buffer.length > 0);
  });
});
