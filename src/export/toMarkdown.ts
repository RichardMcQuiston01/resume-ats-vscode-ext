import type { ResumeData } from '../resume/types';

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

  if (resume.experience.length > 0) {
    const entries = resume.experience.map((entry) => {
      const heading = `### ${entry.jobTitle} — ${entry.employer}`;
      const meta = [entry.location, `${entry.startDate} – ${entry.endDate}`]
        .filter((part) => part.trim().length > 0)
        .join(' | ');
      const highlights = highlightsSection(entry.highlights);
      return [heading, meta, highlights].filter((part) => part.length > 0).join('\n\n');
    });
    sections.push(`## Experience\n\n${entries.join('\n\n')}`);
  }

  if (resume.education.length > 0) {
    const entries = resume.education.map((entry) => {
      const heading = `### ${entry.degree}${entry.fieldOfStudy ? `, ${entry.fieldOfStudy}` : ''}`;
      const meta = [entry.institution, entry.graduationDate, entry.gpa ? `GPA: ${entry.gpa}` : '']
        .filter((part) => part.trim().length > 0)
        .join(' | ');
      return [heading, meta].filter((part) => part.length > 0).join('\n\n');
    });
    sections.push(`## Education\n\n${entries.join('\n\n')}`);
  }

  if (resume.skills.length > 0) {
    const entries = resume.skills.map(
      (group) => `- **${group.category}:** ${group.skills.join(', ')}`,
    );
    sections.push(`## Skills\n\n${entries.join('\n')}`);
  }

  if (resume.certifications.length > 0) {
    const entries = resume.certifications.map(
      (entry) => `- ${entry.name} — ${entry.issuer} (${entry.issueDate})`,
    );
    sections.push(`## Certifications\n\n${entries.join('\n')}`);
  }

  if (resume.projects.length > 0) {
    const entries = resume.projects.map((entry) => {
      const heading = `### ${entry.name}`;
      const meta = [entry.description, entry.url]
        .filter((part) => part.trim().length > 0)
        .join(' — ');
      const highlights = highlightsSection(entry.highlights);
      return [heading, meta, highlights].filter((part) => part.length > 0).join('\n\n');
    });
    sections.push(`## Projects\n\n${entries.join('\n\n')}`);
  }

  return `${sections.join('\n\n')}\n`;
}
