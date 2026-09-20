import * as assert from 'assert';
import { getRequiredFieldErrors } from '../../resume/requiredFields';
import { createDefaultResume } from '../../resume/template';
import { fullyPopulatedResume } from './fixtures';

suite('getRequiredFieldErrors', () => {
  test('returns no errors for a fully populated resume', () => {
    assert.deepStrictEqual(getRequiredFieldErrors(fullyPopulatedResume()), []);
  });

  test('flags a blank contact full name and email on a default resume', () => {
    const errors = getRequiredFieldErrors(createDefaultResume());
    const messages = errors.map((error) => error.message);
    assert.ok(messages.includes('Full name is required.'));
    assert.ok(messages.includes('Email is required.'));
  });

  test('does not require experience, education, skills, certifications, or projects entries to exist', () => {
    const resume = createDefaultResume();
    resume.contact.fullName = 'Jordan Smith';
    resume.contact.email = 'jordan@example.com';
    assert.deepStrictEqual(getRequiredFieldErrors(resume), []);
  });

  test('flags a blank job title or employer on an experience entry', () => {
    const resume = fullyPopulatedResume();
    resume.experience[0].jobTitle = '';
    resume.experience[0].employer = '  ';
    const errors = getRequiredFieldErrors(resume);
    assert.ok(errors.some((error) => error.message === 'Experience #1: job title is required.'));
    assert.ok(errors.some((error) => error.message === 'Experience #1: employer is required.'));
  });

  test('flags a blank institution or degree on an education entry', () => {
    const resume = fullyPopulatedResume();
    resume.education[0].institution = '';
    resume.education[0].degree = '  ';
    const errors = getRequiredFieldErrors(resume);
    assert.ok(errors.some((error) => error.message === 'Education #1: institution is required.'));
    assert.ok(errors.some((error) => error.message === 'Education #1: degree is required.'));
  });

  test('leaves skills, certifications, and projects fields unchecked', () => {
    const resume = fullyPopulatedResume();
    resume.skills[0].category = '';
    resume.certifications[0].name = '';
    resume.projects[0].name = '';
    assert.deepStrictEqual(getRequiredFieldErrors(resume), []);
  });
});
