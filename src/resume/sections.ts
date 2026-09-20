import type { ResumeData, SectionKey } from './types';

// Preserves the section order the exporters used before sectionOrder existed,
// so resume.json files saved before this feature keep producing the same output.
export const DEFAULT_SECTION_ORDER: SectionKey[] = [
  'experience',
  'education',
  'skills',
  'certifications',
  'projects',
];

export const SECTION_LABELS: Record<SectionKey, string> = {
  education: 'Education',
  experience: 'Experience',
  skills: 'Skills',
  certifications: 'Certifications',
  projects: 'Projects',
};

function isValidSectionOrder(value: unknown): value is SectionKey[] {
  return (
    Array.isArray(value) &&
    value.length === DEFAULT_SECTION_ORDER.length &&
    DEFAULT_SECTION_ORDER.every((key) => value.includes(key))
  );
}

export function resolveSectionOrder(resume: Pick<ResumeData, 'sectionOrder'>): SectionKey[] {
  // Always a fresh copy: callers (e.g. the webview's reorder controls) mutate the
  // returned array in place, and DEFAULT_SECTION_ORDER must stay untouched.
  return isValidSectionOrder(resume.sectionOrder)
    ? [...resume.sectionOrder]
    : [...DEFAULT_SECTION_ORDER];
}
