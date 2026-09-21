import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import type { ResumeData, SectionKey } from '../resume/types';
import { resolveSectionOrder } from '../resume/sections';
import { parseMarkdownRuns, type RichTextRun } from '../resume/richText';

const PAGE_WIDTH = 612; // US Letter, points
const PAGE_HEIGHT = 792;
const MARGIN = 54;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

interface ParagraphOptions {
  size?: number;
  font?: PDFFont;
  indent?: number;
  gapAfter?: number;
}

// Lays out resume text on US Letter pages by hand: pdf-lib has no text-flow layer of
// its own, only drawText at fixed coordinates, so wrapping and pagination live here.
class PdfWriter {
  regular!: PDFFont;
  bold!: PDFFont;
  italic!: PDFFont;
  private doc!: PDFDocument;
  private page!: PDFPage;
  private y = 0;

  static async create(): Promise<PdfWriter> {
    const writer = new PdfWriter();
    writer.doc = await PDFDocument.create();
    writer.regular = await writer.doc.embedFont(StandardFonts.Helvetica);
    writer.bold = await writer.doc.embedFont(StandardFonts.HelveticaBold);
    writer.italic = await writer.doc.embedFont(StandardFonts.HelveticaOblique);
    writer.addPage();
    return writer;
  }

  private addPage(): void {
    this.page = this.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.y = PAGE_HEIGHT - MARGIN;
  }

  private ensureSpace(lineHeight: number): void {
    if (this.y - lineHeight < MARGIN) {
      this.addPage();
    }
  }

  private wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
    const words = text.split(/\s+/).filter((word) => word.length > 0);
    const lines: string[] = [];
    let current = '';
    for (const word of words) {
      const candidate = current.length > 0 ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) > maxWidth && current.length > 0) {
        lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }
    if (current.length > 0) {
      lines.push(current);
    }
    return lines;
  }

  writeParagraph(text: string, options: ParagraphOptions = {}): void {
    if (text.trim().length === 0) {
      return;
    }
    const size = options.size ?? 10;
    const font = options.font ?? this.regular;
    const indent = options.indent ?? 0;
    const lineHeight = size * 1.3;
    const lines = this.wrap(text, font, size, CONTENT_WIDTH - indent);
    for (const line of lines) {
      this.ensureSpace(lineHeight);
      this.page.drawText(line, { x: MARGIN + indent, y: this.y, size, font, color: rgb(0, 0, 0) });
      this.y -= lineHeight;
    }
    this.y -= options.gapAfter ?? 4;
  }

  writeHeading(text: string): void {
    this.ensureSpace(24);
    this.y -= 8;
    this.page.drawText(text.toUpperCase(), {
      x: MARGIN,
      y: this.y,
      size: 13,
      font: this.bold,
      color: rgb(0, 0, 0),
    });
    this.y -= 16;
  }

  writeBullets(items: string[]): void {
    for (const item of items) {
      this.writeParagraph(`• ${item}`, { indent: 10, gapAfter: 2 });
    }
  }

  private runFont(run: RichTextRun): PDFFont {
    if (run.bold) {
      return this.bold;
    }
    if (run.italic) {
      return this.italic;
    }
    return this.regular;
  }

  // Word-wraps a sequence of differently-styled runs on one logical paragraph, since
  // drawText only places a single run of same-font text at a time.
  private writeRuns(runs: RichTextRun[], options: ParagraphOptions = {}): void {
    const size = options.size ?? 10;
    const indent = options.indent ?? 0;
    const lineHeight = size * 1.3;
    const maxWidth = CONTENT_WIDTH - indent;

    interface Word {
      text: string;
      font: PDFFont;
    }
    const words: Word[] = [];
    for (const run of runs) {
      const font = this.runFont(run);
      for (const word of run.text.split(/\s+/).filter((part) => part.length > 0)) {
        words.push({ text: word, font });
      }
    }
    if (words.length === 0) {
      return;
    }

    const spaceWidth = this.regular.widthOfTextAtSize(' ', size);
    let line: Word[] = [];
    let lineWidth = 0;

    const flushLine = (): void => {
      if (line.length === 0) {
        return;
      }
      this.ensureSpace(lineHeight);
      let x = MARGIN + indent;
      for (const word of line) {
        this.page.drawText(word.text, { x, y: this.y, size, font: word.font, color: rgb(0, 0, 0) });
        x += word.font.widthOfTextAtSize(word.text, size) + spaceWidth;
      }
      this.y -= lineHeight;
      line = [];
      lineWidth = 0;
    };

    for (const word of words) {
      const wordWidth = word.font.widthOfTextAtSize(word.text, size);
      const additional = (line.length > 0 ? spaceWidth : 0) + wordWidth;
      if (lineWidth + additional > maxWidth && line.length > 0) {
        flushLine();
        lineWidth = wordWidth;
        line = [word];
      } else {
        lineWidth += additional;
        line.push(word);
      }
    }
    flushLine();
    this.y -= options.gapAfter ?? 4;
  }

  // Like writeBullets, but each item may contain **bold**/*italic* Markdown-style
  // runs (from the webview's Highlights toolbar) rendered as real bold/italic text.
  writeRichBullets(items: string[]): void {
    for (const item of items) {
      if (item.trim().length === 0) {
        continue;
      }
      const runs: RichTextRun[] = [
        { text: '• ', bold: false, italic: false },
        ...parseMarkdownRuns(item),
      ];
      this.writeRuns(runs, { indent: 10, gapAfter: 2 });
    }
  }

  async toBuffer(): Promise<Buffer> {
    const bytes = await this.doc.save();
    return Buffer.from(bytes);
  }
}

function writeExperienceSection(writer: PdfWriter, resume: ResumeData): void {
  if (resume.experience.length === 0) {
    return;
  }
  writer.writeHeading('Experience');
  for (const entry of resume.experience) {
    const meta = [entry.location, `${entry.startDate} – ${entry.endDate}`]
      .filter((part) => part.trim().length > 0)
      .join('  |  ');
    writer.writeParagraph(`${entry.jobTitle} — ${entry.employer}`, {
      size: 11,
      font: writer.bold,
      gapAfter: 2,
    });
    if (meta.length > 0) {
      writer.writeParagraph(meta, { size: 9, gapAfter: 2 });
    }
    writer.writeRichBullets(entry.highlights);
  }
}

function writeEducationSection(writer: PdfWriter, resume: ResumeData): void {
  if (resume.education.length === 0) {
    return;
  }
  writer.writeHeading('Education');
  for (const entry of resume.education) {
    const degree = entry.fieldOfStudy ? `${entry.degree}, ${entry.fieldOfStudy}` : entry.degree;
    const meta = [entry.institution, entry.graduationDate, entry.gpa ? `GPA: ${entry.gpa}` : '']
      .filter((part) => part.trim().length > 0)
      .join('  |  ');
    writer.writeParagraph(degree, { size: 11, font: writer.bold, gapAfter: 2 });
    if (meta.length > 0) {
      writer.writeParagraph(meta, { size: 9, gapAfter: 6 });
    }
  }
}

function writeSkillsSection(writer: PdfWriter, resume: ResumeData): void {
  if (resume.skills.length === 0) {
    return;
  }
  writer.writeHeading('Skills');
  for (const group of resume.skills) {
    writer.writeParagraph(`${group.category}: ${group.skills.join(', ')}`);
  }
}

function writeCertificationsSection(writer: PdfWriter, resume: ResumeData): void {
  if (resume.certifications.length === 0) {
    return;
  }
  writer.writeHeading('Certifications');
  writer.writeBullets(
    resume.certifications.map((entry) => `${entry.name} — ${entry.issuer} (${entry.issueDate})`),
  );
}

function writeProjectsSection(writer: PdfWriter, resume: ResumeData): void {
  if (resume.projects.length === 0) {
    return;
  }
  writer.writeHeading('Projects');
  for (const entry of resume.projects) {
    const meta = [entry.description, entry.url]
      .filter((part) => part.trim().length > 0)
      .join(' — ');
    writer.writeParagraph(entry.name, { size: 11, font: writer.bold, gapAfter: 2 });
    if (meta.length > 0) {
      writer.writeParagraph(meta, { size: 9, gapAfter: 2 });
    }
    writer.writeRichBullets(entry.highlights);
  }
}

const SECTION_WRITERS: Record<SectionKey, (writer: PdfWriter, resume: ResumeData) => void> = {
  experience: writeExperienceSection,
  education: writeEducationSection,
  skills: writeSkillsSection,
  certifications: writeCertificationsSection,
  projects: writeProjectsSection,
};

export async function resumeToPdfBuffer(resume: ResumeData): Promise<Buffer> {
  const writer = await PdfWriter.create();

  const name = resume.contact.fullName.trim().length > 0 ? resume.contact.fullName : 'Untitled';
  writer.writeParagraph(name, { size: 20, font: writer.bold, gapAfter: 4 });

  const contact = [
    resume.contact.email,
    resume.contact.phone,
    resume.contact.location,
    resume.contact.linkedInUrl,
    resume.contact.portfolioUrl,
  ]
    .filter((part) => part.trim().length > 0)
    .join('  |  ');
  writer.writeParagraph(contact, { size: 10, gapAfter: 10 });

  if (resume.summary.trim().length > 0) {
    writer.writeHeading('Summary');
    writer.writeParagraph(resume.summary);
  }

  for (const key of resolveSectionOrder(resume)) {
    SECTION_WRITERS[key](writer, resume);
  }

  return writer.toBuffer();
}
