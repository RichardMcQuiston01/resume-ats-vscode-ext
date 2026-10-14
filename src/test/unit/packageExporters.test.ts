import * as assert from 'assert';
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';
import { resumeToDocxBuffer, resumeToHtml, resumeToPdfBuffer } from '../../export/packageExporters';
import { CLASSIC_STYLE } from '../../export/exportStyle';
import { createDefaultResume } from '../../resume/template';
import type { ResumeData } from '../../resume/types';
import { fullyPopulatedResume } from './fixtures';

const STANDARD = 'standard';

async function docxXml(buffer: Buffer, part = 'word/document.xml'): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const file = zip.file(part);
  assert.ok(file, `${part} should be in the .docx archive`);
  return file.async('string');
}

function longHighlightResume(): ResumeData {
  const resume = fullyPopulatedResume();
  resume.experience[0]!.highlights = Array.from(
    { length: 120 },
    (_, index) =>
      `Delivered improvement ${index + 1} across the platform, working with several teams.`,
  );
  return resume;
}

suite('resumeToHtml (shared exporter)', () => {
  test('renders the name as the page title and an h1', () => {
    const html = resumeToHtml(fullyPopulatedResume(), CLASSIC_STYLE);

    assert.ok(html.includes('<title>Jordan Smith</title>'));
    assert.ok(html.includes('<h1>Jordan Smith</h1>'));
  });

  test('falls back to "Resume" when the name is blank', () => {
    const html = resumeToHtml(createDefaultResume(), CLASSIC_STYLE);

    assert.ok(html.includes('<title>Resume</title>'));
  });

  test('escapes HTML-significant characters in user content', () => {
    const resume = fullyPopulatedResume();
    resume.contact.fullName = '<script>alert(1)</script>';
    resume.summary = 'R&D "lead" <b>';

    const html = resumeToHtml(resume, CLASSIC_STYLE);

    assert.ok(!html.includes('<script>alert(1)</script>'));
    assert.ok(html.includes('&lt;script&gt;'));
    assert.ok(html.includes('R&amp;D'));
  });

  test('never emits table or img elements (ATS parsers misread both)', () => {
    const html = resumeToHtml(fullyPopulatedResume(), CLASSIC_STYLE);

    assert.ok(!/<table|<img/i.test(html));
  });

  test('omits empty sections entirely', () => {
    const resume = fullyPopulatedResume();
    resume.certifications = [];
    resume.projects = [];

    const html = resumeToHtml(resume, CLASSIC_STYLE);

    assert.ok(!html.includes('Certifications'));
    assert.ok(!html.includes('Projects'));
    assert.ok(html.includes('Experience'));
  });

  test('renders Markdown-style bold/italic highlights as real <strong>/<em> tags', () => {
    const resume = fullyPopulatedResume();
    resume.experience[0]!.highlights = ['Cut costs by **30%** using *caching*'];

    const html = resumeToHtml(resume, CLASSIC_STYLE);

    assert.ok(html.includes('<li>Cut costs by <strong>30%</strong> using <em>caching</em></li>'));
  });

  test('renders sections in the resume’s configured sectionOrder', () => {
    const resume = fullyPopulatedResume();
    resume.sectionOrder = ['projects', 'skills', 'education', 'experience', 'certifications'];

    const html = resumeToHtml(resume, CLASSIC_STYLE);

    assert.ok(html.indexOf('>Projects<') < html.indexOf('>Skills<'));
    assert.ok(html.indexOf('>Skills<') < html.indexOf('>Experience<'));
  });

  test('keeps a project URL after its description, as the exports always have', () => {
    const html = resumeToHtml(fullyPopulatedResume(), CLASSIC_STYLE);

    assert.ok(html.includes('A useful tool. — https://example.com'));
  });

  test('keeps the LinkedIn and portfolio URLs in the contact details', () => {
    const resume = fullyPopulatedResume();
    resume.contact.portfolioUrl = 'https://jordan.dev';

    const html = resumeToHtml(resume, CLASSIC_STYLE);

    assert.ok(html.includes('https://linkedin.com/in/jordansmith'));
    assert.ok(html.includes('https://jordan.dev'));
  });

  test('applies the chosen style: font family, size, and heading case', () => {
    const html = resumeToHtml(fullyPopulatedResume(), {
      fontFamily: 'serif',
      fontSize: 12,
      headingCase: 'upper',
    });

    assert.ok(html.includes('"Times New Roman", Times, serif'));
    assert.ok(html.includes('font-size: 12pt'));
  });

  test('the standard preset leaves the exporter’s built-in look unchanged', () => {
    const resume = fullyPopulatedResume();

    assert.strictEqual(resumeToHtml(resume, STANDARD), resumeToHtml(resume, {}));
  });

  test('rejects an invalid style with a descriptive message instead of a broken file', () => {
    assert.throws(
      () => resumeToHtml(fullyPopulatedResume(), { fontSize: 99 }),
      /Invalid export style: fontSize 99 is outside the supported range of 8 to 16\./,
    );
  });
});

suite('resumeToDocxBuffer (shared exporter)', () => {
  test('produces a non-empty ZIP-signed buffer (DOCX is a ZIP container)', async () => {
    const buffer = await resumeToDocxBuffer(fullyPopulatedResume(), CLASSIC_STYLE);

    assert.ok(buffer.length > 0);
    assert.strictEqual(buffer.subarray(0, 2).toString('latin1'), 'PK');
  });

  test('succeeds for a blank default resume', async () => {
    const buffer = await resumeToDocxBuffer(createDefaultResume(), CLASSIC_STYLE);

    assert.ok(buffer.length > 0);
  });

  test('writes bold and italic highlight markup as styled runs, not literal asterisks', async () => {
    const resume = fullyPopulatedResume();
    resume.experience[0]!.highlights = ['Cut costs by **30%** using *caching*'];

    const xml = await docxXml(await resumeToDocxBuffer(resume, CLASSIC_STYLE));

    assert.ok(/<w:b\/>[^]*?<w:t[^>]*>30%<\/w:t>/.test(xml));
    assert.ok(/<w:i\/>[^]*?<w:t[^>]*>caching<\/w:t>/.test(xml));
    assert.ok(!xml.includes('**'));
  });

  test('follows the resume’s configured sectionOrder', async () => {
    const resume = fullyPopulatedResume();
    resume.sectionOrder = ['skills', 'experience', 'education', 'certifications', 'projects'];

    const xml = await docxXml(await resumeToDocxBuffer(resume, { headingCase: 'title' }));

    assert.ok(xml.indexOf('>Skills<') < xml.indexOf('>Experience<'));
  });

  test('applies the chosen font and size to the whole document', async () => {
    const buffer = await resumeToDocxBuffer(fullyPopulatedResume(), {
      fontFamily: 'serif',
      fontSize: 12,
    });

    const styles = await docxXml(buffer, 'word/styles.xml');

    assert.ok(styles.includes('w:ascii="Times New Roman"'));
    assert.ok(/<w:sz w:val="24"\/>/.test(styles));
  });
});

suite('resumeToPdfBuffer (shared exporter)', () => {
  test('produces a buffer with a valid PDF header', async () => {
    const buffer = await resumeToPdfBuffer(fullyPopulatedResume(), CLASSIC_STYLE);

    assert.strictEqual(buffer.subarray(0, 5).toString('latin1'), '%PDF-');
  });

  test('succeeds for a blank default resume', async () => {
    const buffer = await resumeToPdfBuffer(createDefaultResume(), CLASSIC_STYLE);

    assert.strictEqual(buffer.subarray(0, 5).toString('latin1'), '%PDF-');
  });

  test('wraps a very long list of highlights across multiple pages without throwing', async () => {
    const buffer = await resumeToPdfBuffer(longHighlightResume(), CLASSIC_STYLE);
    const doc = await PDFDocument.load(buffer);

    assert.ok(doc.getPageCount() > 1);
  });

  test('succeeds for a highlight containing Markdown-style bold/italic markup', async () => {
    const resume = fullyPopulatedResume();
    resume.experience[0]!.highlights = ['A **bold** and *italic* highlight'];

    const buffer = await resumeToPdfBuffer(resume, CLASSIC_STYLE);

    assert.strictEqual(buffer.subarray(0, 5).toString('latin1'), '%PDF-');
  });

  test('uses the chosen paper size', async () => {
    const doc = await PDFDocument.load(
      await resumeToPdfBuffer(fullyPopulatedResume(), { pageSize: 'a4' }),
    );
    const { width, height } = doc.getPages()[0]!.getSize();

    assert.ok(Math.abs(width - 595.28) < 0.1);
    assert.ok(Math.abs(height - 841.89) < 0.1);
  });

  test('roomier settings use more pages than tighter ones for the same content', async () => {
    const resume = longHighlightResume();
    const pages = async (preset: 'compact' | 'comfortable'): Promise<number> =>
      (await PDFDocument.load(await resumeToPdfBuffer(resume, preset))).getPageCount();

    assert.ok((await pages('compact')) < (await pages('comfortable')));
  });
});
