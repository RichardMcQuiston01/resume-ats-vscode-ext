import * as assert from 'assert';
import JSZip from 'jszip';
import { resumeToDocxBuffer, resumeToHtml } from '../../export/packageExporters';
import { resumeToMarkdown } from '../../export/toMarkdown';
import { getFormatWarnings } from '../../resume/formatWarnings';
import { toPackageResume } from '../../resume/toPackageResume';
import type { ResumeData } from '../../resume/types';
import { normalizeResumeData, validateResumeData } from '../../resume/validate';
import { emptyCertificationEntry, emptyProjectEntry } from '../../webview/formState';
import { fullyPopulatedResume, resumeWithEntryDetails } from './fixtures';

const FIXED_NOW = new Date('2026-01-01T00:00:00.000Z');

/** A resume.json as earlier versions saved it: no project or certification detail fields. */
function olderResumeJson(): unknown {
  const resume = JSON.parse(JSON.stringify(fullyPopulatedResume())) as ResumeData;
  for (const certification of resume.certifications) {
    delete (certification as Partial<typeof certification>).credentialUrl;
  }
  for (const project of resume.projects) {
    const partial = project as Partial<typeof project>;
    delete partial.repoUrl;
    delete partial.demoUrl;
    delete partial.techStack;
    delete partial.outcome;
  }
  return resume;
}

async function docxXml(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const file = zip.file('word/document.xml');
  assert.ok(file, 'word/document.xml should be in the .docx archive');
  return file.async('string');
}

suite('project and certification details: data', () => {
  test('a resume.json saved before these fields existed still validates', () => {
    const result = validateResumeData(olderResumeJson());

    assert.deepStrictEqual(result.errors, []);
    assert.strictEqual(result.valid, true);
  });

  test('normalizing fills in the missing fields without touching the input', () => {
    const older = olderResumeJson() as ResumeData;

    const normalized = normalizeResumeData(older);

    assert.deepStrictEqual(normalized.projects[0], {
      name: 'Side Project',
      description: 'A useful tool.',
      url: 'https://example.com',
      repoUrl: '',
      demoUrl: '',
      techStack: [],
      outcome: '',
      highlights: ['Built with TypeScript'],
    });
    assert.strictEqual(normalized.certifications[0]?.credentialUrl, '');
    assert.strictEqual('repoUrl' in (older.projects[0] ?? {}), false);
    assert.deepStrictEqual(validateResumeData(normalized).errors, []);
  });

  test('normalizing leaves values that are already present alone', () => {
    const resume = resumeWithEntryDetails();

    assert.deepStrictEqual(normalizeResumeData(resume), resume);
  });

  test('rejects detail fields of the wrong type', () => {
    const resume = resumeWithEntryDetails() as unknown as Record<string, unknown[]>;
    Object.assign(resume.projects![0] as object, { techStack: 'TypeScript', repoUrl: 3 });
    Object.assign(resume.certifications![0] as object, { credentialUrl: false });

    const { errors } = validateResumeData(resume);

    assert.ok(errors.includes('projects[0].techStack must be an array of strings'));
    assert.ok(errors.includes('projects[0].repoUrl must be a string'));
    assert.ok(errors.includes('certifications[0].credentialUrl must be a string'));
  });

  test('new empty entries carry every detail field', () => {
    assert.deepStrictEqual(emptyProjectEntry(), {
      name: '',
      description: '',
      url: '',
      repoUrl: '',
      demoUrl: '',
      techStack: [],
      outcome: '',
      highlights: [],
    });
    assert.strictEqual(emptyCertificationEntry().credentialUrl, '');
  });

  test('warns, without blocking, about a link that is not a web address', () => {
    const resume = resumeWithEntryDetails();
    resume.projects[0]!.repoUrl = 'github.com/example/side-project';
    resume.projects[0]!.demoUrl = 'not a url';
    resume.certifications[0]!.credentialUrl = 'verify me';

    const warnings = getFormatWarnings(resume);

    assert.ok(warnings.some((warning) => warning.startsWith('Project #1 repository URL')));
    assert.ok(warnings.some((warning) => warning.startsWith('Project #1 demo URL')));
    assert.ok(warnings.some((warning) => warning.startsWith('Certification #1 credential URL')));
    assert.deepStrictEqual(getFormatWarnings(resumeWithEntryDetails()), []);
  });
});

suite('project and certification details: package resume', () => {
  test('maps every detail onto the package resume', () => {
    const converted = toPackageResume(resumeWithEntryDetails(), { now: FIXED_NOW });
    const [project] = converted.projects;

    assert.strictEqual(project?.repoUrl, 'https://github.com/example/side-project');
    assert.strictEqual(project?.demoUrl, 'https://demo.example.com');
    assert.deepStrictEqual(project?.techStack, ['TypeScript', 'Node.js']);
    assert.strictEqual(project?.outcome, 'Cut report time from 2 days to 2 hours.');
    assert.strictEqual(
      converted.certifications[0]?.credentialUrl,
      'https://verify.example.com/cert/42',
    );
  });

  test('omits blank details and trims the tech stack', () => {
    const resume = resumeWithEntryDetails();
    Object.assign(resume.projects[0]!, {
      repoUrl: '  ',
      demoUrl: '',
      outcome: ' ',
      techStack: [' Go ', '', '  '],
    });
    resume.certifications[0]!.credentialUrl = '';

    const converted = toPackageResume(resume, { now: FIXED_NOW });
    const [project] = converted.projects;

    assert.strictEqual(project?.repoUrl, undefined);
    assert.strictEqual(project?.demoUrl, undefined);
    assert.strictEqual(project?.outcome, undefined);
    assert.deepStrictEqual(project?.techStack, ['Go']);
    assert.strictEqual(converted.certifications[0]?.credentialUrl, undefined);
  });
});

suite('project and certification details: exports', () => {
  test('HTML prints each detail where its setting says', () => {
    const html = resumeToHtml(resumeWithEntryDetails(), 'standard', {
      projectLinks: 'below',
      projectTechStack: 'heading',
      projectOutcome: 'below',
      credentialUrl: 'below',
    });

    assert.ok(html.includes('Side Project — TypeScript, Node.js'));
    assert.ok(html.includes('<p>Outcome: Cut report time from 2 days to 2 hours.</p>'));
    assert.ok(html.includes('Code: <a href="https://github.com/example/side-project">'));
    assert.ok(html.includes('Demo: <a href="https://demo.example.com">'));
    assert.ok(html.includes('<p>Credential: <a href="https://verify.example.com/cert/42">'));
  });

  test('prints none of the optional details when they are off', () => {
    const html = resumeToHtml(resumeWithEntryDetails(), 'standard', {
      projectLinks: 'off',
      projectTechStack: 'off',
      projectOutcome: 'off',
      credentialUrl: 'off',
    });

    for (const text of ['Node.js', 'Outcome', 'demo.example.com', 'verify.example.com', 'github']) {
      assert.ok(!html.includes(text), `${text} should not be printed`);
    }
  });

  test('Word output carries the details too', async () => {
    const xml = await docxXml(
      await resumeToDocxBuffer(resumeWithEntryDetails(), 'standard', {
        projectTechStack: 'below',
        projectOutcome: 'below',
        credentialUrl: 'below',
      }),
    );

    assert.ok(xml.includes('Tech stack: TypeScript, Node.js'));
    assert.ok(xml.includes('Outcome: Cut report time from 2 days to 2 hours.'));
    assert.ok(xml.includes('Credential: https://verify.example.com/cert/42'));
  });

  test('Markdown lists every detail that was entered', () => {
    const markdown = resumeToMarkdown(resumeWithEntryDetails());

    assert.ok(markdown.includes('**Tech stack:** TypeScript, Node.js'));
    assert.ok(markdown.includes('**Outcome:** Cut report time from 2 days to 2 hours.'));
    assert.ok(markdown.includes('**Repository:** https://github.com/example/side-project'));
    assert.ok(markdown.includes('**Demo:** https://demo.example.com'));
    assert.ok(
      markdown.includes('- AWS Certified — AWS (2021-01) — https://verify.example.com/cert/42'),
    );
  });

  test('Markdown is unchanged when a project has no details', () => {
    const markdown = resumeToMarkdown(fullyPopulatedResume());

    assert.ok(!markdown.includes('Tech stack'));
    assert.ok(!markdown.includes('Outcome'));
    assert.ok(markdown.includes('- AWS Certified — AWS (2021-01)\n'));
  });
});
