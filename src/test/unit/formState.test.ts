import * as assert from 'assert';
import {
  emptyCertificationEntry,
  emptyEducationEntry,
  emptyExperienceEntry,
  emptyProjectEntry,
  emptySkillGroup,
  formatHighlightsText,
  formatSkillList,
  moveArrayItem,
  parseHighlightsText,
  parseSkillList,
} from '../../webview/formState';
import { createDefaultResume } from '../../resume/template';
import { validateResumeData } from '../../resume/validate';

suite('parseHighlightsText / formatHighlightsText', () => {
  test('splits lines into trimmed, non-empty highlights', () => {
    const parsed = parseHighlightsText('  Shipped feature X  \n\nReduced latency by 30%\n  ');
    assert.deepStrictEqual(parsed, ['Shipped feature X', 'Reduced latency by 30%']);
  });

  test('round-trips through format and parse', () => {
    const highlights = ['First highlight', 'Second highlight'];
    assert.deepStrictEqual(parseHighlightsText(formatHighlightsText(highlights)), highlights);
  });

  test('formats an empty list as an empty string', () => {
    assert.strictEqual(formatHighlightsText([]), '');
  });
});

suite('parseSkillList / formatSkillList', () => {
  test('splits comma-separated skills into trimmed, non-empty entries', () => {
    const parsed = parseSkillList('TypeScript,  Go ,, Python');
    assert.deepStrictEqual(parsed, ['TypeScript', 'Go', 'Python']);
  });

  test('round-trips through format and parse', () => {
    const skills = ['TypeScript', 'Go'];
    assert.deepStrictEqual(parseSkillList(formatSkillList(skills)), skills);
  });
});

suite('moveArrayItem', () => {
  test('moves an item up, swapping it with its predecessor', () => {
    const items = ['a', 'b', 'c'];
    moveArrayItem(items, 1, 'up');
    assert.deepStrictEqual(items, ['b', 'a', 'c']);
  });

  test('moves an item down, swapping it with its successor', () => {
    const items = ['a', 'b', 'c'];
    moveArrayItem(items, 1, 'down');
    assert.deepStrictEqual(items, ['a', 'c', 'b']);
  });

  test('is a no-op when moving the first item up', () => {
    const items = ['a', 'b', 'c'];
    moveArrayItem(items, 0, 'up');
    assert.deepStrictEqual(items, ['a', 'b', 'c']);
  });

  test('is a no-op when moving the last item down', () => {
    const items = ['a', 'b', 'c'];
    moveArrayItem(items, 2, 'down');
    assert.deepStrictEqual(items, ['a', 'b', 'c']);
  });
});

suite('empty entry factories', () => {
  test('produce entries that validate as part of a full resume', () => {
    const resume = createDefaultResume();
    resume.education.push(emptyEducationEntry());
    resume.experience.push(emptyExperienceEntry());
    resume.skills.push(emptySkillGroup());
    resume.certifications.push(emptyCertificationEntry());
    resume.projects.push(emptyProjectEntry());

    const result = validateResumeData(resume);
    assert.deepStrictEqual(result.errors, []);
    assert.strictEqual(result.valid, true);
  });
});
