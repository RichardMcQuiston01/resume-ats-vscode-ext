import * as assert from 'assert';
import { createDefaultResume } from '../../resume/template';
import { validateResumeData } from '../../resume/validate';

suite('createDefaultResume', () => {
  test('produces a resume that passes validation', () => {
    const result = validateResumeData(createDefaultResume());
    assert.deepStrictEqual(result.errors, []);
    assert.strictEqual(result.valid, true);
  });

  test('starts every section empty', () => {
    const resume = createDefaultResume();
    assert.strictEqual(resume.schemaVersion, 1);
    assert.strictEqual(resume.summary, '');
    assert.deepStrictEqual(resume.education, []);
    assert.deepStrictEqual(resume.experience, []);
    assert.deepStrictEqual(resume.skills, []);
    assert.deepStrictEqual(resume.certifications, []);
    assert.deepStrictEqual(resume.projects, []);
  });

  test('returns a fresh object on every call', () => {
    const first = createDefaultResume();
    const second = createDefaultResume();
    assert.notStrictEqual(first, second);
    assert.notStrictEqual(first.contact, second.contact);
    assert.notStrictEqual(first.education, second.education);
  });
});
