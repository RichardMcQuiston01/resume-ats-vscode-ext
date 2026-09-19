import type {
  CertificationEntry,
  ContactInfo,
  EducationEntry,
  ExperienceEntry,
  ProjectEntry,
  ResumeData,
  SkillGroup,
} from './types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

function pushIfInvalid(errors: string[], condition: boolean, message: string): void {
  if (!condition) {
    errors.push(message);
  }
}

function validateContact(value: unknown, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push('contact must be an object');
    return;
  }
  const contact = value as Partial<Record<keyof ContactInfo, unknown>>;
  const requiredStringFields: Array<keyof ContactInfo> = [
    'fullName',
    'email',
    'phone',
    'location',
    'linkedInUrl',
    'portfolioUrl',
  ];
  for (const field of requiredStringFields) {
    pushIfInvalid(errors, typeof contact[field] === 'string', `contact.${field} must be a string`);
  }
}

function validateEducation(value: unknown, errors: string[]): void {
  if (!Array.isArray(value)) {
    errors.push('education must be an array');
    return;
  }
  value.forEach((entry: unknown, index: number) => {
    if (!isRecord(entry)) {
      errors.push(`education[${index}] must be an object`);
      return;
    }
    const education = entry as Partial<Record<keyof EducationEntry, unknown>>;
    const requiredStringFields: Array<keyof EducationEntry> = [
      'institution',
      'degree',
      'fieldOfStudy',
      'graduationDate',
      'gpa',
    ];
    for (const field of requiredStringFields) {
      pushIfInvalid(
        errors,
        typeof education[field] === 'string',
        `education[${index}].${field} must be a string`,
      );
    }
  });
}

function validateExperience(value: unknown, errors: string[]): void {
  if (!Array.isArray(value)) {
    errors.push('experience must be an array');
    return;
  }
  value.forEach((entry: unknown, index: number) => {
    if (!isRecord(entry)) {
      errors.push(`experience[${index}] must be an object`);
      return;
    }
    const experience = entry as Partial<Record<keyof ExperienceEntry, unknown>>;
    const requiredStringFields: Array<keyof ExperienceEntry> = [
      'jobTitle',
      'employer',
      'location',
      'startDate',
      'endDate',
    ];
    for (const field of requiredStringFields) {
      pushIfInvalid(
        errors,
        typeof experience[field] === 'string',
        `experience[${index}].${field} must be a string`,
      );
    }
    pushIfInvalid(
      errors,
      isStringArray(experience.highlights),
      `experience[${index}].highlights must be an array of strings`,
    );
  });
}

function validateSkills(value: unknown, errors: string[]): void {
  if (!Array.isArray(value)) {
    errors.push('skills must be an array');
    return;
  }
  value.forEach((entry: unknown, index: number) => {
    if (!isRecord(entry)) {
      errors.push(`skills[${index}] must be an object`);
      return;
    }
    const skillGroup = entry as Partial<Record<keyof SkillGroup, unknown>>;
    pushIfInvalid(
      errors,
      typeof skillGroup.category === 'string',
      `skills[${index}].category must be a string`,
    );
    pushIfInvalid(
      errors,
      isStringArray(skillGroup.skills),
      `skills[${index}].skills must be an array of strings`,
    );
  });
}

function validateCertifications(value: unknown, errors: string[]): void {
  if (!Array.isArray(value)) {
    errors.push('certifications must be an array');
    return;
  }
  value.forEach((entry: unknown, index: number) => {
    if (!isRecord(entry)) {
      errors.push(`certifications[${index}] must be an object`);
      return;
    }
    const certification = entry as Partial<Record<keyof CertificationEntry, unknown>>;
    const requiredStringFields: Array<keyof CertificationEntry> = ['name', 'issuer', 'issueDate'];
    for (const field of requiredStringFields) {
      pushIfInvalid(
        errors,
        typeof certification[field] === 'string',
        `certifications[${index}].${field} must be a string`,
      );
    }
  });
}

function validateProjects(value: unknown, errors: string[]): void {
  if (!Array.isArray(value)) {
    errors.push('projects must be an array');
    return;
  }
  value.forEach((entry: unknown, index: number) => {
    if (!isRecord(entry)) {
      errors.push(`projects[${index}] must be an object`);
      return;
    }
    const project = entry as Partial<Record<keyof ProjectEntry, unknown>>;
    const requiredStringFields: Array<keyof ProjectEntry> = ['name', 'description', 'url'];
    for (const field of requiredStringFields) {
      pushIfInvalid(
        errors,
        typeof project[field] === 'string',
        `projects[${index}].${field} must be a string`,
      );
    }
    pushIfInvalid(
      errors,
      isStringArray(project.highlights),
      `projects[${index}].highlights must be an array of strings`,
    );
  });
}

export function validateResumeData(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (!isRecord(data)) {
    return { valid: false, errors: ['resume data must be a JSON object'] };
  }

  const resume = data as Partial<Record<keyof ResumeData, unknown>>;
  pushIfInvalid(errors, resume.schemaVersion === 1, 'schemaVersion must be 1');
  pushIfInvalid(errors, typeof resume.summary === 'string', 'summary must be a string');

  validateContact(resume.contact, errors);
  validateEducation(resume.education, errors);
  validateExperience(resume.experience, errors);
  validateSkills(resume.skills, errors);
  validateCertifications(resume.certifications, errors);
  validateProjects(resume.projects, errors);

  return { valid: errors.length === 0, errors };
}
