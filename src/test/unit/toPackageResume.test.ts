import * as assert from 'assert';
import { checkResumeStructure, parseResume } from '@richardmcquiston01/ats-resume-export';
import { toPackageResume } from '../../resume/toPackageResume';
import { createDefaultResume } from '../../resume/template';
import type { ResumeData } from '../../resume/types';
import { fullyPopulatedResume } from './fixtures';

const FIXED_NOW: Date = new Date('2026-01-01T00:00:00.000Z');

suite('toPackageResume', () => {
  test('converts a fully populated resume into one the package accepts', () => {
    const converted = toPackageResume(fullyPopulatedResume(), { now: FIXED_NOW });

    assert.doesNotThrow(() => parseResume(converted));
    assert.deepStrictEqual(
      checkResumeStructure(converted).filter((finding) => finding.severity === 'error'),
      [],
    );
  });

  test('maps contact details and turns the LinkedIn and portfolio URLs into links', () => {
    const data = fullyPopulatedResume();
    data.contact.portfolioUrl = 'https://jordan.dev';

    const { contact } = toPackageResume(data, { now: FIXED_NOW });

    assert.strictEqual(contact.fullName, 'Jordan Smith');
    assert.strictEqual(contact.email, 'jordan@example.com');
    assert.strictEqual(contact.phone, '555-0100');
    assert.deepStrictEqual(
      contact.links.map((link) => [link.label, link.url]),
      [
        ['LinkedIn', 'https://linkedin.com/in/jordansmith'],
        ['Portfolio', 'https://jordan.dev'],
      ],
    );
  });

  test('omits blank optional fields and empty links', () => {
    const data = fullyPopulatedResume();
    data.contact.phone = '  ';
    data.contact.location = '';
    data.contact.linkedInUrl = '';
    data.summary = '';

    const converted = toPackageResume(data, { now: FIXED_NOW });

    assert.strictEqual(converted.contact.phone, undefined);
    assert.strictEqual(converted.contact.location, undefined);
    assert.deepStrictEqual(converted.contact.links, []);
    assert.strictEqual(converted.summary, undefined);
  });

  test('maps a Present end date to isCurrent with no endDate', () => {
    const [entry] = toPackageResume(fullyPopulatedResume(), { now: FIXED_NOW }).experience;

    assert.strictEqual(entry?.company, 'Example Corp');
    assert.strictEqual(entry?.title, 'Software Engineer');
    assert.strictEqual(entry?.isCurrent, true);
    assert.strictEqual(entry?.endDate, undefined);
  });

  test('keeps a real end date and marks the entry as not current', () => {
    const data = fullyPopulatedResume();
    data.experience[0]!.endDate = '2020-03';

    const [entry] = toPackageResume(data, { now: FIXED_NOW }).experience;

    assert.strictEqual(entry?.isCurrent, false);
    assert.strictEqual(entry?.endDate, '2020-03');
  });

  test('does not treat a blank end date as current, so the package still flags it', () => {
    const data = fullyPopulatedResume();
    data.experience[0]!.endDate = '';

    const converted = toPackageResume(data, { now: FIXED_NOW });
    const findings = checkResumeStructure(converted);

    assert.strictEqual(converted.experience[0]?.isCurrent, false);
    assert.ok(findings.some((finding) => finding.id === 'experience.0.endDate'));
  });

  test('combines degree and field of study and keeps the GPA as a highlight', () => {
    const [entry] = toPackageResume(fullyPopulatedResume(), { now: FIXED_NOW }).education;

    assert.strictEqual(entry?.institution, 'State University');
    assert.strictEqual(entry?.credential, 'B.S., Computer Science');
    assert.strictEqual(entry?.endDate, '2018-05');
    assert.deepStrictEqual(entry?.highlights, ['GPA: 3.8']);
  });

  test('handles an education entry with only some fields filled in', () => {
    const data = fullyPopulatedResume();
    data.education = [
      {
        institution: 'Night School',
        degree: '',
        fieldOfStudy: 'Welding',
        graduationDate: '',
        gpa: '',
      },
    ];

    const [entry] = toPackageResume(data, { now: FIXED_NOW }).education;

    assert.strictEqual(entry?.credential, 'Welding');
    assert.strictEqual(entry?.endDate, undefined);
    assert.deepStrictEqual(entry?.highlights, []);
  });

  test('maps skills, certifications, and projects', () => {
    const converted = toPackageResume(fullyPopulatedResume(), { now: FIXED_NOW });

    assert.deepStrictEqual(converted.skills[0]?.skills, ['TypeScript', 'Go']);
    assert.strictEqual(converted.certifications[0]?.issuer, 'AWS');
    assert.strictEqual(converted.certifications[0]?.issueDate, '2021-01');
    assert.strictEqual(converted.projects[0]?.url, 'https://example.com');
    assert.deepStrictEqual(converted.projects[0]?.highlights, ['Built with TypeScript']);
  });

  test('keeps bold and italic markers in highlights as plain text', () => {
    const data = fullyPopulatedResume();
    data.experience[0]!.highlights = ['Cut costs by **30%** using *caching*'];

    const [entry] = toPackageResume(data, { now: FIXED_NOW }).experience;

    assert.deepStrictEqual(entry?.highlights, ['Cut costs by **30%** using *caching*']);
  });

  test('is deterministic: the same input and timestamp give identical output', () => {
    assert.deepStrictEqual(
      toPackageResume(fullyPopulatedResume(), { now: FIXED_NOW }),
      toPackageResume(fullyPopulatedResume(), { now: FIXED_NOW }),
    );
  });

  test('derives a unique id for every entity', () => {
    const data = fullyPopulatedResume();
    data.experience.push({ ...data.experience[0]!, employer: 'Other Corp' });
    const converted = toPackageResume(data, { now: FIXED_NOW });

    const ids: string[] = [
      converted.id,
      ...converted.contact.links.map((link) => link.id),
      ...converted.experience.map((entry) => entry.id),
      ...converted.education.map((entry) => entry.id),
      ...converted.skills.map((group) => group.id),
      ...converted.certifications.map((entry) => entry.id),
      ...converted.projects.map((entry) => entry.id),
    ];

    assert.strictEqual(new Set(ids).size, ids.length);
  });

  test('converts an untouched new resume and lets the package report what is missing', () => {
    const converted = toPackageResume(createDefaultResume(), { now: FIXED_NOW });
    const errorIds: string[] = checkResumeStructure(converted)
      .filter((finding) => finding.severity === 'error')
      .map((finding) => finding.id);

    assert.ok(errorIds.includes('contact.fullName'));
    assert.ok(errorIds.includes('contact.email'));
  });

  test('passes a valid sectionOrder through', () => {
    const data = fullyPopulatedResume();
    data.sectionOrder = ['projects', 'skills', 'education', 'experience', 'certifications'];

    assert.deepStrictEqual(toPackageResume(data, { now: FIXED_NOW }).sectionOrder, [
      'projects',
      'skills',
      'education',
      'experience',
      'certifications',
    ]);
  });

  test('falls back to the default order for an invalid sectionOrder', () => {
    const data = fullyPopulatedResume();
    data.sectionOrder = ['projects'] as unknown as ResumeData['sectionOrder'];

    assert.deepStrictEqual(toPackageResume(data, { now: FIXED_NOW }).sectionOrder, [
      'experience',
      'education',
      'skills',
      'certifications',
      'projects',
    ]);
  });

  test('prints a project URL after its description, as the exports always have', () => {
    const [project] = toPackageResume(fullyPopulatedResume(), { now: FIXED_NOW }).projects;

    assert.strictEqual(project?.description, 'A useful tool. — https://example.com');
  });

  test('uses the URL alone when a project has no description', () => {
    const data = fullyPopulatedResume();
    data.projects[0]!.description = '';

    const [project] = toPackageResume(data, { now: FIXED_NOW }).projects;

    assert.strictEqual(project?.description, 'https://example.com');
  });

  test('leaves a project description alone when it has no URL', () => {
    const data = fullyPopulatedResume();
    data.projects[0]!.url = '';

    const [project] = toPackageResume(data, { now: FIXED_NOW }).projects;

    assert.strictEqual(project?.description, 'A useful tool.');
  });
});
