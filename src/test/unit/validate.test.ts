import * as assert from 'assert';
import { createDefaultResume } from '../../resume/template';
import { validateResumeData } from '../../resume/validate';
import type { ResumeData } from '../../resume/types';

suite('validateResumeData', () => {
  test('rejects non-object input', () => {
    const result = validateResumeData('not a resume');
    assert.strictEqual(result.valid, false);
    assert.deepStrictEqual(result.errors, ['resume data must be a JSON object']);
  });

  test('rejects the wrong schemaVersion', () => {
    const resume = { ...createDefaultResume(), schemaVersion: 2 };
    const result = validateResumeData(resume);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.includes('schemaVersion must be 1'));
  });

  test('reports every missing contact field', () => {
    const resume: Partial<ResumeData> = { ...createDefaultResume(), contact: {} as never };
    const result = validateResumeData(resume);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.includes('contact.fullName must be a string'));
    assert.ok(result.errors.includes('contact.email must be a string'));
  });

  test('validates a fully populated resume', () => {
    const resume: ResumeData = {
      schemaVersion: 1,
      contact: {
        fullName: 'Jordan Smith',
        email: 'jordan@example.com',
        phone: '555-0100',
        location: 'Remote',
        linkedInUrl: 'https://linkedin.com/in/jordansmith',
        portfolioUrl: 'https://jordansmith.dev',
      },
      summary: 'Experienced software engineer.',
      education: [
        {
          institution: 'State University',
          degree: 'B.S.',
          fieldOfStudy: 'Computer Science',
          graduationDate: '2018-05',
          gpa: '3.8',
        },
      ],
      experience: [
        {
          jobTitle: 'Software Engineer',
          employer: 'Example Corp',
          location: 'Remote',
          startDate: '2018-06',
          endDate: 'Present',
          highlights: ['Shipped feature X', 'Reduced latency by 30%'],
        },
      ],
      skills: [{ category: 'Languages', skills: ['TypeScript', 'Go'] }],
      certifications: [{ name: 'AWS Certified', issuer: 'AWS', issueDate: '2021-01' }],
      projects: [
        {
          name: 'Side Project',
          description: 'A useful tool.',
          url: 'https://example.com',
          highlights: ['Built with TypeScript'],
        },
      ],
    };

    const result = validateResumeData(resume);
    assert.deepStrictEqual(result.errors, []);
    assert.strictEqual(result.valid, true);
  });

  test('rejects an experience entry with non-array highlights', () => {
    const resume = createDefaultResume();
    const invalid = {
      ...resume,
      experience: [
        {
          jobTitle: 'Engineer',
          employer: 'Example Corp',
          location: 'Remote',
          startDate: '2020',
          endDate: 'Present',
          highlights: 'not an array',
        },
      ],
    };
    const result = validateResumeData(invalid);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.includes('experience[0].highlights must be an array of strings'));
  });
});
