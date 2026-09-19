import * as assert from 'assert';
import { checkAtsCompatibility } from '../../resume/atsRules';
import { createDefaultResume } from '../../resume/template';
import type { ResumeData } from '../../resume/types';
import { fullyPopulatedResume } from './fixtures';

function codesOf(resume: ResumeData): string[] {
  return checkAtsCompatibility(resume).map((warning) => warning.code);
}

suite('checkAtsCompatibility', () => {
  test('flags a blank default resume for every missing section', () => {
    const codes = codesOf(createDefaultResume());
    assert.ok(codes.includes('missing-email'));
    assert.ok(codes.includes('missing-phone'));
    assert.ok(codes.includes('missing-summary'));
    assert.ok(codes.includes('no-experience'));
    assert.ok(codes.includes('no-skills'));
  });

  test('reports no warnings for a well-formed resume', () => {
    assert.deepStrictEqual(checkAtsCompatibility(fullyPopulatedResume()), []);
  });

  test('flags an experience entry with no highlights', () => {
    const resume = fullyPopulatedResume();
    resume.experience[0].highlights = [];
    const codes = codesOf(resume);
    assert.ok(codes.includes('empty-highlights'));
  });

  test('flags a highlight over the length threshold', () => {
    const resume = fullyPopulatedResume();
    resume.experience[0].highlights = ['x'.repeat(221)];
    const codes = codesOf(resume);
    assert.ok(codes.includes('highlight-too-long'));
  });

  test('flags highlights with unsafe characters', () => {
    const resume = fullyPopulatedResume();
    resume.experience[0].highlights = ['★ Led a team of 5 engineers'];
    const codes = codesOf(resume);
    assert.ok(codes.includes('unsafe-characters'));
  });

  test('flags a highlight over the length threshold in projects too', () => {
    const resume = fullyPopulatedResume();
    resume.projects = [
      {
        name: 'Side Project',
        description: 'A tool.',
        url: 'https://example.com',
        highlights: ['y'.repeat(221)],
      },
    ];
    const codes = codesOf(resume);
    assert.ok(codes.includes('highlight-too-long'));
  });

  test('flags duplicate skills within a group, case-insensitively', () => {
    const resume = fullyPopulatedResume();
    resume.skills = [{ category: 'Languages', skills: ['TypeScript', 'typescript'] }];
    const codes = codesOf(resume);
    assert.ok(codes.includes('duplicate-skill'));
  });

  test('does not flag distinct skills as duplicates', () => {
    const resume = fullyPopulatedResume();
    resume.skills = [{ category: 'Languages', skills: ['TypeScript', 'Go', 'Python'] }];
    const codes = codesOf(resume);
    assert.ok(!codes.includes('duplicate-skill'));
  });
});
