import * as assert from 'assert';
import { parseMarkdownRuns } from '../../resume/richText';

suite('parseMarkdownRuns', () => {
  test('returns a single plain run for text with no markup', () => {
    assert.deepStrictEqual(parseMarkdownRuns('Shipped feature X'), [
      { text: 'Shipped feature X', bold: false, italic: false },
    ]);
  });

  test('parses a bold run', () => {
    assert.deepStrictEqual(parseMarkdownRuns('Reduced latency by **30%**'), [
      { text: 'Reduced latency by ', bold: false, italic: false },
      { text: '30%', bold: true, italic: false },
    ]);
  });

  test('parses an italic run', () => {
    assert.deepStrictEqual(parseMarkdownRuns('Led the *Q3 launch*'), [
      { text: 'Led the ', bold: false, italic: false },
      { text: 'Q3 launch', bold: false, italic: true },
    ]);
  });

  test('parses bold and italic runs together', () => {
    assert.deepStrictEqual(parseMarkdownRuns('**Cut costs** by *15%* company-wide'), [
      { text: 'Cut costs', bold: true, italic: false },
      { text: ' by ', bold: false, italic: false },
      { text: '15%', bold: false, italic: true },
      { text: ' company-wide', bold: false, italic: false },
    ]);
  });

  test('leaves an unmatched single asterisk as plain text', () => {
    assert.deepStrictEqual(parseMarkdownRuns('C* programming'), [
      { text: 'C* programming', bold: false, italic: false },
    ]);
  });

  test('handles an empty string', () => {
    assert.deepStrictEqual(parseMarkdownRuns(''), [{ text: '', bold: false, italic: false }]);
  });
});
