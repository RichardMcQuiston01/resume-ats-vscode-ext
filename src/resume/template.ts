import type { ResumeData } from './types';
import { DEFAULT_SECTION_ORDER } from './sections';

export function createDefaultResume(): ResumeData {
  return {
    schemaVersion: 1,
    contact: {
      fullName: '',
      email: '',
      phone: '',
      location: '',
      linkedInUrl: '',
      portfolioUrl: '',
    },
    summary: '',
    sectionOrder: [...DEFAULT_SECTION_ORDER],
    education: [],
    experience: [],
    skills: [],
    certifications: [],
    projects: [],
  };
}
