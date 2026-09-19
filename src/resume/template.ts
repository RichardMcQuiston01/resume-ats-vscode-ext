import type { ResumeData } from './types';

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
    education: [],
    experience: [],
    skills: [],
    certifications: [],
    projects: [],
  };
}
