import type {
  CertificationEntry,
  EducationEntry,
  ExperienceEntry,
  ProjectEntry,
  SkillGroup,
} from '../resume/types';

export function emptyEducationEntry(): EducationEntry {
  return { institution: '', degree: '', fieldOfStudy: '', graduationDate: '', gpa: '' };
}

export function emptyExperienceEntry(): ExperienceEntry {
  return {
    jobTitle: '',
    employer: '',
    location: '',
    startDate: '',
    endDate: '',
    highlights: [],
  };
}

export function emptySkillGroup(): SkillGroup {
  return { category: '', skills: [] };
}

export function emptyCertificationEntry(): CertificationEntry {
  return { name: '', issuer: '', issueDate: '' };
}

export function emptyProjectEntry(): ProjectEntry {
  return { name: '', description: '', url: '', highlights: [] };
}

export function parseHighlightsText(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function formatHighlightsText(highlights: string[]): string {
  return highlights.join('\n');
}

export function parseSkillList(text: string): string[] {
  return text
    .split(',')
    .map((skill) => skill.trim())
    .filter((skill) => skill.length > 0);
}

export function formatSkillList(skills: string[]): string {
  return skills.join(', ');
}

export function moveArrayItem<T>(array: T[], index: number, direction: 'up' | 'down'): void {
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= array.length) {
    return;
  }
  const [item] = array.splice(index, 1);
  array.splice(targetIndex, 0, item);
}
