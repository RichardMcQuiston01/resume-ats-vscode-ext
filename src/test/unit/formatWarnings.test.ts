import * as assert from 'assert';
import { getFormatWarnings } from '../../resume/formatWarnings';
import { createDefaultResume } from '../../resume/template';
import { fullyPopulatedResume } from './fixtures';

suite('getFormatWarnings', () => {
  test('returns no warnings for a fully populated resume', () => {
    assert.deepStrictEqual(getFormatWarnings(fullyPopulatedResume()), []);
  });

  test('returns no warnings for a blank default resume (blank fields are not warned about)', () => {
    assert.deepStrictEqual(getFormatWarnings(createDefaultResume()), []);
  });

  test('flags an email with no @ or domain', () => {
    const resume = fullyPopulatedResume();
    resume.contact.email = 'not-an-email';
    const warnings = getFormatWarnings(resume);
    assert.ok(warnings.includes('Email does not look like a valid email address.'));
  });

  test('flags a phone number with letters', () => {
    const resume = fullyPopulatedResume();
    resume.contact.phone = 'call me maybe';
    const warnings = getFormatWarnings(resume);
    assert.ok(warnings.includes('Phone does not look like a valid phone number.'));
  });

  test('flags a phone number that is too short or too long', () => {
    const resume = fullyPopulatedResume();
    resume.contact.phone = '555';
    assert.ok(getFormatWarnings(resume).includes('Phone does not look like a valid phone number.'));

    resume.contact.phone = '1'.repeat(21);
    assert.ok(getFormatWarnings(resume).includes('Phone does not look like a valid phone number.'));
  });

  test('accepts common phone formatting characters', () => {
    const resume = fullyPopulatedResume();
    resume.contact.phone = '+1 (555) 123-4567';
    assert.deepStrictEqual(getFormatWarnings(resume), []);
  });

  test('flags a LinkedIn URL with no scheme', () => {
    const resume = fullyPopulatedResume();
    resume.contact.linkedInUrl = 'linkedin.com/in/jordan';
    const warnings = getFormatWarnings(resume);
    assert.ok(
      warnings.includes('LinkedIn URL does not look like a valid web address (include https://).'),
    );
  });

  test('flags a Portfolio URL with no scheme', () => {
    const resume = fullyPopulatedResume();
    resume.contact.portfolioUrl = 'not a url';
    const warnings = getFormatWarnings(resume);
    assert.ok(
      warnings.includes('Portfolio URL does not look like a valid web address (include https://).'),
    );
  });

  test('accepts a well-formed https URL', () => {
    const resume = fullyPopulatedResume();
    resume.contact.linkedInUrl = 'https://www.linkedin.com/in/jordan';
    resume.contact.portfolioUrl = 'https://jordan.dev';
    assert.deepStrictEqual(getFormatWarnings(resume), []);
  });
});
