import type { ResumeData } from './types';

// The minimal set of fields a resume can't be saved without — everything else
// (summary, dates, skills, certifications, projects, ...) stays optional.
export interface RequiredFieldError {
  path: Array<string | number>;
  message: string;
}

function isBlank(value: string): boolean {
  return value.trim().length === 0;
}

export function getRequiredFieldErrors(resume: ResumeData): RequiredFieldError[] {
  const errors: RequiredFieldError[] = [];

  if (isBlank(resume.contact.fullName)) {
    errors.push({ path: ['contact', 'fullName'], message: 'Full name is required.' });
  }
  if (isBlank(resume.contact.email)) {
    errors.push({ path: ['contact', 'email'], message: 'Email is required.' });
  }

  resume.experience.forEach((entry, index) => {
    if (isBlank(entry.jobTitle)) {
      errors.push({
        path: ['experience', index, 'jobTitle'],
        message: `Experience #${index + 1}: job title is required.`,
      });
    }
    if (isBlank(entry.employer)) {
      errors.push({
        path: ['experience', index, 'employer'],
        message: `Experience #${index + 1}: employer is required.`,
      });
    }
  });

  resume.education.forEach((entry, index) => {
    if (isBlank(entry.institution)) {
      errors.push({
        path: ['education', index, 'institution'],
        message: `Education #${index + 1}: institution is required.`,
      });
    }
    if (isBlank(entry.degree)) {
      errors.push({
        path: ['education', index, 'degree'],
        message: `Education #${index + 1}: degree is required.`,
      });
    }
  });

  return errors;
}
