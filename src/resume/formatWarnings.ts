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

  return warnings;
}
