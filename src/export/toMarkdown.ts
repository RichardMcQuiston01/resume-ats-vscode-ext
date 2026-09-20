import type { ResumeData, SectionKey } from '../resume/types';
import { resolveSectionOrder } from '../resume/sections';

function contactLine(resume: ResumeData): string {
  const parts = [
    resume.contact.email,
    resume.contact.phone,
    resume.contact.location,
    resume.contact.linkedInUrl,
    resume.contact.portfolioUrl,
  ].filter((part) => part.trim().length > 0);
  return parts.join(' | ');
}

function highlightsSection(highlights: string[]): string {
  return highlights.map((highlight) => `- ${highlight}`).join('\n');
}

function experienceSection(resume: ResumeData): string | undefined {
  if (resume.experience.length === 0) {
    return undefined;
  }
  const entries = resume.experience.map((entry) => {
    const heading = `### ${entry.jobTitle} — ${entry.employer}`;
    const meta = [entry.location, `${entry.startDate} – ${entry.endDate}`]
      .filter((part) => part.trim().length > 0)
      .join(' | ');
    const highlights = highlightsSection(entry.highlights);
    return [heading, meta, highlights].filter((part) => part.length > 0).join('\n\n');
  });
  return `## Experience\n\n${entries.join('\n\n')}`;
}

function educationSection(resume: ResumeData): string | undefined {
  if (resume.education.length === 0) {
    return undefined;
  }
  const entries = resume.education.map((entry) => {
    const heading = `### ${entry.degree}${entry.fieldOfStudy ? `, ${entry.fieldOfStudy}` : ''}`;
    const meta = [entry.institution, entry.graduationDate, entry.gpa ? `GPA: ${entry.gpa}` : '']
      .filter((part) => part.trim().length > 0)
      .join(' | ');
    return [heading, meta].filter((part) => part.length > 0).join('\n\n');
  });
  return `## Education\n\n${entries.join('\n\n')}`;
}

function skillsSection(resume: ResumeData): string | undefined {
  if (resume.skills.length === 0) {
    return undefined;
  }
  const entries = resume.skills.map(
    (group) => `- **${group.category}:** ${group.skills.join(', ')}`,
  );
  return `## Skills\n\n${entries.join('\n')}`;
}

function certificationsSection(resume: ResumeData): string | undefined {
  if (resume.certifications.length === 0) {
    return undefined;
  }
  const entries = resume.certifications.map(
    (entry) => `- ${entry.name} — ${entry.issuer} (${entry.issueDate})`,
  );
  return `## Certifications\n\n${entries.join('\n')}`;
}

function projectsSection(resume: ResumeData): string | undefined {
  if (resume.projects.length === 0) {
    return undefined;
  }
  const entries = resume.projects.map((entry) => {
    const heading = `### ${entry.name}`;
    const meta = [entry.description, entry.url]
      .filter((part) => part.trim().length > 0)
      .join(' — ');
    const highlights = highlightsSection(entry.highlights);
    return [heading, meta, highlights].filter((part) => part.length > 0).join('\n\n');
  });
  return `## Projects\n\n${entries.join('\n\n')}`;
}

const SECTION_BUILDERS: Record<SectionKey, (resume: ResumeData) => string | undefined> = {
  experience: experienceSection,
  education: educationSection,
  skills: skillsSection,
  certifications: certificationsSection,
  projects: projectsSection,
};

export function resumeToMarkdown(resume: ResumeData): string {
  const sections: string[] = [];

  const name = resume.contact.fullName.trim().length > 0 ? resume.contact.fullName : 'Untitled';
  sections.push(`# ${name}`);

  const contact = contactLine(resume);
  if (contact.length > 0) {
    sections.push(contact);
  }

  if (resume.summary.trim().length > 0) {
    sections.push(`## Summary\n\n${resume.summary}`);
  }

  for (const key of resolveSectionOrder(resume)) {
    const rendered = SECTION_BUILDERS[key](resume);
    if (rendered) {
      sections.push(rendered);
    }
  }

  return `${sections.join('\n\n')}\n`;
}
