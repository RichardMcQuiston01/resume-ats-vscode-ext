import * as assert from 'assert';
import { DEFAULT_SECTION_ORDER, resolveSectionOrder } from '../../resume/sections';
import { createDefaultResume } from '../../resume/template';
import type { SectionKey } from '../../resume/types';

suite('resolveSectionOrder', () => {
  test('returns the resume’s own sectionOrder when it is a valid permutation', () => {
    const sectionOrder: SectionKey[] = [
      'education',
      'experience',
      'skills',
      'certifications',
      'projects',
    ];
    const resume = { ...createDefaultResume(), sectionOrder };
    assert.deepStrictEqual(resolveSectionOrder(resume), [
      'education',
      'experience',
      'skills',
      'certifications',
      'projects',
    ]);
  });

  test('falls back to the default order when sectionOrder is missing', () => {
    const resume = { ...createDefaultResume() };
    delete (resume as { sectionOrder?: unknown }).sectionOrder;
    assert.deepStrictEqual(resolveSectionOrder(resume), DEFAULT_SECTION_ORDER);
  });

  test('falls back to the default order when sectionOrder is malformed', () => {
    const resume = { ...createDefaultResume(), sectionOrder: ['education', 'experience'] as never };
    assert.deepStrictEqual(resolveSectionOrder(resume), DEFAULT_SECTION_ORDER);
  });
});
