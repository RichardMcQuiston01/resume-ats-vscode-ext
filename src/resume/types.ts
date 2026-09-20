export interface ContactInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedInUrl: string;
  portfolioUrl: string;
}

export interface EducationEntry {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  graduationDate: string;
  gpa: string;
}

export interface ExperienceEntry {
  jobTitle: string;
  employer: string;
  location: string;
  startDate: string;
  endDate: string;
  highlights: string[];
}

export interface SkillGroup {
  category: string;
  skills: string[];
}

export interface CertificationEntry {
  name: string;
  issuer: string;
  issueDate: string;
}

export interface ProjectEntry {
  name: string;
  description: string;
  url: string;
  highlights: string[];
}

export type SectionKey = 'education' | 'experience' | 'skills' | 'certifications' | 'projects';

export interface ResumeData {
  schemaVersion: 1;
  contact: ContactInfo;
  summary: string;
  sectionOrder: SectionKey[];
  education: EducationEntry[];
  experience: ExperienceEntry[];
  skills: SkillGroup[];
  certifications: CertificationEntry[];
  projects: ProjectEntry[];
}
