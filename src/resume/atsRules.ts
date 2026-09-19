import type { ResumeData } from './types';

export interface AtsWarning {
  code: string;
  message: string;
  path: Array<string | number>;
}

const MAX_HIGHLIGHT_LENGTH = 220;

// Control characters and common decorative glyphs/emoji that many ATS parsers either
// strip or mis-render, hurting keyword extraction. The control-character ranges are
// intentional, not a mistake — disable the rule that assumes otherwise.
const DISALLOWED_CHARACTERS_PATTERN =
  // eslint-disable-next-line no-control-regex -- intentionally matching control characters
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F•■▲●★➤\uD800-\uDFFF]/u;

function hasDisallowedCharacters(text: string): boolean {
  return DISALLOWED_CHARACTERS_PATTERN.test(text);
}

function checkHighlights(
  entries: Array<{ highlights: string[] }>,
  sectionPath: 'experience' | 'projects',
  warnings: AtsWarning[],
): void {
  entries.forEach((entry, index) => {
    entry.highlights.forEach((highlight, highlightIndex) => {
      const path = [sectionPath, index, 'highlights', highlightIndex];

      if (highlight.length > MAX_HIGHLIGHT_LENGTH) {
        warnings.push({
          code: 'highlight-too-long',
          message: `Highlight is over ${MAX_HIGHLIGHT_LENGTH} characters — break long paragraphs into separate bullet points.`,
          path,
        });
      }

      if (hasDisallowedCharacters(highlight)) {
        warnings.push({
          code: 'unsafe-characters',
          message:
            'Contains special characters or symbols that some ATS parsers cannot read reliably; use plain punctuation instead.',
          path,
        });
      }
    });
  });
}

export function checkAtsCompatibility(resume: ResumeData): AtsWarning[] {
  const warnings: AtsWarning[] = [];

  if (resume.contact.email.trim().length === 0) {
    warnings.push({
      code: 'missing-email',
      message: 'Missing email address — most ATS systems require one to file the application.',
      path: ['contact', 'email'],
    });
  }

  if (resume.contact.phone.trim().length === 0) {
    warnings.push({
      code: 'missing-phone',
      message: 'Missing phone number.',
      path: ['contact', 'phone'],
    });
  }

  if (resume.summary.trim().length === 0) {
    warnings.push({
      code: 'missing-summary',
      message: 'Add a professional summary — ATS systems weight this section for keyword matching.',
      path: ['summary'],
    });
  }

  if (resume.experience.length === 0) {
    warnings.push({
      code: 'no-experience',
      message: 'Add at least one work experience entry.',
      path: ['experience'],
    });
  }

  if (resume.skills.length === 0) {
    warnings.push({
      code: 'no-skills',
      message: 'Add a skills section — ATS keyword matching relies heavily on listed skills.',
      path: ['skills'],
    });
  }

  resume.experience.forEach((entry, index) => {
    if (entry.highlights.length === 0) {
      warnings.push({
        code: 'empty-highlights',
        message: `Experience entry "${entry.jobTitle || index + 1}" has no highlights — add bullet points describing your impact.`,
        path: ['experience', index, 'highlights'],
      });
    }
  });

  checkHighlights(resume.experience, 'experience', warnings);
  checkHighlights(resume.projects, 'projects', warnings);

  resume.skills.forEach((group, index) => {
    const seen = new Set<string>();
    group.skills.forEach((skill) => {
      const key = skill.trim().toLowerCase();
      if (key.length === 0) {
        return;
      }
      if (seen.has(key)) {
        warnings.push({
          code: 'duplicate-skill',
          message: `Duplicate skill "${skill}" in "${group.category || 'Skills'}" group.`,
          path: ['skills', index, 'skills'],
        });
      }
      seen.add(key);
    });
  });

  return warnings;
}
