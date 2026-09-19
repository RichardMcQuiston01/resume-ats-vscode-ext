import * as assert from 'assert';
import { resumeToHtml } from '../../export/toHtml';
import { createDefaultResume } from '../../resume/template';
import { fullyPopulatedResume } from './fixtures';

suite('resumeToHtml', () => {
  test('renders the name as the page title and an h1', () => {
    const html = resumeToHtml(fullyPopulatedResume());
    assert.ok(html.includes('<title>Jordan Smith</title>'));
    assert.ok(html.includes('<h1>Jordan Smith</h1>'));
  });

  test('falls back to "Untitled" when the name is blank', () => {
    const html = resumeToHtml(createDefaultResume());
    assert.ok(html.includes('<h1>Untitled</h1>'));
  });

  test('escapes HTML-significant characters in user content', () => {
    const resume = fullyPopulatedResume();
    resume.summary = 'Built <script>alert(1)</script> & "quoted" things';
    const html = resumeToHtml(resume);
    assert.ok(!html.includes('<script>alert(1)</script>'));
    assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
    assert.ok(html.includes('&amp;'));
    assert.ok(html.includes('&quot;quoted&quot;'));
  });

  test('never emits table or img elements', () => {
    const html = resumeToHtml(fullyPopulatedResume());
    assert.ok(!/<table/i.test(html));
    assert.ok(!/<img/i.test(html));
  });

  test('omits empty sections entirely', () => {
    const resume = fullyPopulatedResume();
    resume.certifications = [];
    const html = resumeToHtml(resume);
    assert.ok(!html.includes('<h2>Certifications</h2>'));
  });
});
