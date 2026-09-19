import * as assert from 'assert';
import { resumeToPdfBuffer } from '../../export/toPdf';
import { createDefaultResume } from '../../resume/template';
import { fullyPopulatedResume } from './fixtures';

suite('resumeToPdfBuffer', () => {
  test('produces a buffer with a valid PDF header', async () => {
    const buffer = await resumeToPdfBuffer(fullyPopulatedResume());
    assert.ok(buffer.length > 0);
    assert.strictEqual(buffer.subarray(0, 5).toString('latin1'), '%PDF-');
  });

  test('succeeds for a blank default resume', async () => {
    const buffer = await resumeToPdfBuffer(createDefaultResume());
    assert.ok(buffer.length > 0);
    assert.strictEqual(buffer.subarray(0, 5).toString('latin1'), '%PDF-');
  });

  test('wraps a very long highlight across multiple pages without throwing', async () => {
    const resume = fullyPopulatedResume();
    resume.experience[0].highlights = [
      Array.from({ length: 400 }, (_, index) => `word${index}`).join(' '),
    ];
    const buffer = await resumeToPdfBuffer(resume);
    assert.ok(buffer.length > 0);
  });
});
