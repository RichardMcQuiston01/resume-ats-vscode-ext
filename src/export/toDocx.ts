import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';
import type { ResumeData, SectionKey } from '../resume/types';
import { resolveSectionOrder } from '../resume/sections';

function contactLine(resume: ResumeData): string {
  return [
    resume.contact.email,
    resume.contact.phone,
    resume.contact.location,
    resume.contact.linkedInUrl,
    resume.contact.portfolioUrl,
  ]
    .filter((part) => part.trim().length > 0)
    .join(' | ');
}

function bulletParagraphs(highlights: string[]): Paragraph[] {
  return highlights.map((highlight) => new Paragraph({ text: highlight, bullet: { level: 0 } }));
}

function labeledMeta(label: string, meta: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text: label, bold: true }),
      new TextRun({ text: meta.length > 0 ? ` — ${meta}` : '', italics: true }),
    ],
  });
}

function experienceParagraphs(resume: ResumeData): Paragraph[] {
  if (resume.experience.length === 0) {
    return [];
  }
  const paragraphs: Paragraph[] = [
    new Paragraph({ text: 'Experience', heading: HeadingLevel.HEADING_1 }),
  ];
  for (const entry of resume.experience) {
    const meta = [entry.location, `${entry.startDate} – ${entry.endDate}`]
      .filter((part) => part.trim().length > 0)
      .join(' | ');
    paragraphs.push(labeledMeta(`${entry.jobTitle} — ${entry.employer}`, meta));
    paragraphs.push(...bulletParagraphs(entry.highlights));
  }
  return paragraphs;
}

function educationParagraphs(resume: ResumeData): Paragraph[] {
  if (resume.education.length === 0) {
    return [];
  }
  const paragraphs: Paragraph[] = [
    new Paragraph({ text: 'Education', heading: HeadingLevel.HEADING_1 }),
  ];
  for (const entry of resume.education) {
    const degree = entry.fieldOfStudy ? `${entry.degree}, ${entry.fieldOfStudy}` : entry.degree;
    const meta = [entry.institution, entry.graduationDate, entry.gpa ? `GPA: ${entry.gpa}` : '']
      .filter((part) => part.trim().length > 0)
      .join(' | ');
    paragraphs.push(labeledMeta(degree, meta));
  }
  return paragraphs;
}

function skillsParagraphs(resume: ResumeData): Paragraph[] {
  if (resume.skills.length === 0) {
    return [];
  }
  const paragraphs: Paragraph[] = [
    new Paragraph({ text: 'Skills', heading: HeadingLevel.HEADING_1 }),
  ];
  for (const group of resume.skills) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${group.category}: `, bold: true }),
          new TextRun({ text: group.skills.join(', ') }),
        ],
      }),
    );
  }
  return paragraphs;
}

function certificationsParagraphs(resume: ResumeData): Paragraph[] {
  if (resume.certifications.length === 0) {
    return [];
  }
  const paragraphs: Paragraph[] = [
    new Paragraph({ text: 'Certifications', heading: HeadingLevel.HEADING_1 }),
  ];
  for (const entry of resume.certifications) {
    paragraphs.push(
      new Paragraph({
        text: `${entry.name} — ${entry.issuer} (${entry.issueDate})`,
        bullet: { level: 0 },
      }),
    );
  }
  return paragraphs;
}

function projectsParagraphs(resume: ResumeData): Paragraph[] {
  if (resume.projects.length === 0) {
    return [];
  }
  const paragraphs: Paragraph[] = [
    new Paragraph({ text: 'Projects', heading: HeadingLevel.HEADING_1 }),
  ];
  for (const entry of resume.projects) {
    const meta = [entry.description, entry.url]
      .filter((part) => part.trim().length > 0)
      .join(' — ');
    paragraphs.push(labeledMeta(entry.name, meta));
    paragraphs.push(...bulletParagraphs(entry.highlights));
  }
  return paragraphs;
}

const SECTION_BUILDERS: Record<SectionKey, (resume: ResumeData) => Paragraph[]> = {
  experience: experienceParagraphs,
  education: educationParagraphs,
  skills: skillsParagraphs,
  certifications: certificationsParagraphs,
  projects: projectsParagraphs,
};

export async function resumeToDocxBuffer(resume: ResumeData): Promise<Buffer> {
  const children: Paragraph[] = [];

  const name = resume.contact.fullName.trim().length > 0 ? resume.contact.fullName : 'Untitled';
  children.push(new Paragraph({ text: name, heading: HeadingLevel.TITLE }));

  const contact = contactLine(resume);
  if (contact.length > 0) {
    children.push(new Paragraph({ text: contact }));
  }

  if (resume.summary.trim().length > 0) {
    children.push(new Paragraph({ text: 'Summary', heading: HeadingLevel.HEADING_1 }));
    children.push(new Paragraph({ text: resume.summary }));
  }

  for (const key of resolveSectionOrder(resume)) {
    children.push(...SECTION_BUILDERS[key](resume));
  }

  const document = new Document({ sections: [{ children }] });
  return Packer.toBuffer(document);
}
