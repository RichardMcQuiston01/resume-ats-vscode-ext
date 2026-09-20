import * as assert from 'assert';
import { resumeToMarkdown } from '../../export/toMarkdown';
import { createDefaultResume } from '../../resume/template';
import { fullyPopulatedResume } from './fixtures';

suite('resumeToMarkdown', () => {
  test('renders the name as a top-level heading', () => {
    const markdown = resumeToMarkdown(fullyPopulatedResume());
    assert.ok(markdown.startsWith('# Jordan Smith'));
  });

  test('falls back to "Untitled" when the name is blank', () => {
    const markdown = resumeToMarkdown(createDefaultResume());
    assert.ok(markdown.startsWith('# Untitled'));
  });

  test('includes every populated section', () => {
    const markdown = resumeToMarkdown(fullyPopulatedResume());
    assert.ok(markdown.includes('## Summary'));
    assert.ok(markdown.includes('## Experience'));
    assert.ok(markdown.includes('## Education'));
    assert.ok(markdown.includes('## Skills'));
    assert.ok(markdown.includes('## Certifications'));
    assert.ok(markdown.includes('## Projects'));
    assert.ok(markdown.includes('- Shipped feature X'));
    assert.ok(markdown.includes('**Languages:** TypeScript, Go'));
  });

  test('omits empty sections entirely', () => {
    const resume = fullyPopulatedResume();
    resume.certifications = [];
    const markdown = resumeToMarkdown(resume);
    assert.ok(!markdown.includes('## Certifications'));
  });

  test('renders sections in the resume’s configured sectionOrder', () => {
    const resume = fullyPopulatedResume();
    resume.sectionOrder = ['projects', 'skills', 'certifications', 'education', 'experience'];
    const markdown = resumeToMarkdown(resume);
    const indices = resume.sectionOrder.map((key) => {
      const heading = `## ${key.charAt(0).toUpperCase()}${key.slice(1)}`;
      return markdown.indexOf(heading);
    });
    assert.deepStrictEqual(
      [...indices].sort((a, b) => a - b),
      indices,
    );
  });
});
