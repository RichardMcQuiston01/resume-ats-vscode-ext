import * as assert from 'assert';
import { validateExportStyle, type ExportStyleInput } from '@richardmcquiston01/ats-resume-export';
import {
  CLASSIC_STYLE,
  DEFAULT_PRESET,
  DEFAULT_PROJECT_LINKS,
  EXPORT_SETTINGS_SECTION,
  resolveExportSettings,
} from '../../export/exportStyle';

suite('resolveExportSettings', () => {
  test('defaults to the classic look when nothing is set', () => {
    const result = resolveExportSettings({});

    assert.strictEqual(DEFAULT_PRESET, 'classic');
    assert.deepStrictEqual(result.style, CLASSIC_STYLE);
    assert.deepStrictEqual(result.problems, []);
  });

  test('treats empty strings and null as "not set"', () => {
    const result = resolveExportSettings({
      preset: '',
      fontFamily: '',
      fontSize: null,
      pageSize: '',
      headingCase: '',
    });

    assert.deepStrictEqual(result.style, CLASSIC_STYLE);
    assert.deepStrictEqual(result.problems, []);
  });

  test('passes a shared preset through by name', () => {
    const result = resolveExportSettings({ preset: 'comfortable' });

    assert.deepStrictEqual(result.style, { preset: 'comfortable' });
    assert.deepStrictEqual(result.problems, []);
  });

  test('lets individual settings override the preset', () => {
    const classic = resolveExportSettings({ preset: 'classic', fontSize: 11, margin: 72 });
    const compact = resolveExportSettings({ preset: 'compact', fontFamily: 'serif' });

    assert.deepStrictEqual(classic.style, { ...CLASSIC_STYLE, fontSize: 11, margin: 72 });
    assert.deepStrictEqual(compact.style, { preset: 'compact', fontFamily: 'serif' });
  });

  test('ignores an out-of-range setting, says which and why, and keeps the rest', () => {
    const result = resolveExportSettings({ fontSize: 99, lineSpacing: 1.5 });

    assert.strictEqual((result.style as ExportStyleInput).fontSize, CLASSIC_STYLE.fontSize);
    assert.strictEqual((result.style as ExportStyleInput).lineSpacing, 1.5);
    assert.strictEqual(result.problems.length, 1);
    assert.ok(result.problems[0]?.startsWith(`${EXPORT_SETTINGS_SECTION}.fontSize:`));
    assert.ok(result.problems[0]?.includes('outside the supported range of 8 to 16'));
    assert.ok(result.problems[0]?.includes('This setting was ignored.'));
  });

  test('reports every invalid setting, not just the first', () => {
    const result = resolveExportSettings({
      fontFamily: 'comic-sans',
      margin: 500,
      pageSize: 'legal',
    });

    assert.strictEqual(result.problems.length, 3);
    assert.deepStrictEqual(
      validateExportStyle(result.style),
      [],
      'the resolved style is always valid',
    );
  });

  test('falls back to classic for an unknown preset and says so', () => {
    const result = resolveExportSettings({ preset: 'fancy', fontSize: 12 });

    assert.deepStrictEqual(result.style, { ...CLASSIC_STYLE, fontSize: 12 });
    assert.strictEqual(result.problems.length, 1);
    assert.ok(result.problems[0]?.includes('unknown preset "fancy"'));
    assert.ok(result.problems[0]?.includes('classic, compact, standard, comfortable'));
  });

  test('rejects non-numeric values for numeric settings', () => {
    const result = resolveExportSettings({ fontSize: 'big', margin: Number.NaN });

    assert.strictEqual(result.problems.length, 2);
    assert.deepStrictEqual(validateExportStyle(result.style), []);
  });

  test('warns, without blocking, about choices that are hard on human readers', () => {
    const result = resolveExportSettings({ fontSize: 9, margin: 20 });

    assert.deepStrictEqual(result.problems, []);
    assert.strictEqual(result.warnings.length, 2);
    assert.ok(result.warnings.some((warning) => warning.includes('10 pt')));
    assert.ok(result.warnings.some((warning) => warning.includes('Margins')));
  });

  test('has no readability warnings for the built-in looks', () => {
    for (const preset of ['classic', 'compact', 'standard', 'comfortable']) {
      assert.deepStrictEqual(resolveExportSettings({ preset }).warnings, [], preset);
    }
  });

  test('every classic option is valid for the shared exporters', () => {
    assert.deepStrictEqual(validateExportStyle(CLASSIC_STYLE), []);
  });

  test('prints project links on their own line by default, as the exports always showed them', () => {
    const result = resolveExportSettings({});

    assert.strictEqual(DEFAULT_PROJECT_LINKS, 'below');
    assert.deepStrictEqual(result.details, { projectLinks: 'below' });
  });

  test('passes each projectLinks placement through', () => {
    for (const placement of ['off', 'heading', 'below'] as const) {
      const result = resolveExportSettings({ projectLinks: placement });

      assert.deepStrictEqual(result.details, { projectLinks: placement });
      assert.deepStrictEqual(result.problems, []);
    }
  });

  test('treats an empty projectLinks as "not set"', () => {
    const result = resolveExportSettings({ projectLinks: '' });

    assert.deepStrictEqual(result.details, { projectLinks: 'below' });
    assert.deepStrictEqual(result.problems, []);
  });

  test('ignores an unknown projectLinks placement and says why', () => {
    const result = resolveExportSettings({ projectLinks: 'beside' });

    assert.deepStrictEqual(result.details, { projectLinks: 'below' });
    assert.strictEqual(result.problems.length, 1);
    assert.ok(result.problems[0]?.includes('hiredHand.export.projectLinks'));
    assert.ok(result.problems[0]?.includes('"beside"'));
    assert.ok(result.problems[0]?.includes('off, heading, below'));
  });
});
