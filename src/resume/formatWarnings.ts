import type { ResumeData } from './types';

// Non-blocking format checks: unlike requiredFields.ts, nothing here stops a save —
// these just surface as warnings so a typo doesn't silently ship in a resume.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9()+\-.\s]{7,20}$/;

function isBlank(value: string): boolean {
  return value.trim().length === 0;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function warnIfInvalidUrl(warnings: string[], label: string, value: string): void {
  if (!isBlank(value) && !isValidHttpUrl(value.trim())) {
    warnings.push(`${label} does not look like a valid web address (include https://).`);
  }
}

export function getFormatWarnings(resume: ResumeData): string[] {
  const warnings: string[] = [];
  const { email, phone, linkedInUrl, portfolioUrl } = resume.contact;

  if (!isBlank(email) && !EMAIL_PATTERN.test(email.trim())) {
    warnings.push('Email does not look like a valid email address.');
  }
  if (!isBlank(phone) && !PHONE_PATTERN.test(phone.trim())) {
    warnings.push('Phone does not look like a valid phone number.');
  }
  if (!isBlank(linkedInUrl) && !isValidHttpUrl(linkedInUrl.trim())) {
    warnings.push('LinkedIn URL does not look like a valid web address (include https://).');
  }
  if (!isBlank(portfolioUrl) && !isValidHttpUrl(portfolioUrl.trim())) {
    warnings.push('Portfolio URL does not look like a valid web address (include https://).');
  }

  resume.projects.forEach((project, index) => {
    const label = `Project #${index + 1}`;
    warnIfInvalidUrl(warnings, `${label} URL`, project.url);
    warnIfInvalidUrl(warnings, `${label} repository URL`, project.repoUrl);
    warnIfInvalidUrl(warnings, `${label} demo URL`, project.demoUrl);
  });
  resume.certifications.forEach((certification, index) => {
    warnIfInvalidUrl(
      warnings,
      `Certification #${index + 1} credential URL`,
      certification.credentialUrl,
    );
  });

  return warnings;
}
