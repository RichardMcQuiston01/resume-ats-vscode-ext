import {
  checkExportStyle,
  DETAIL_PLACEMENTS,
  OUTCOME_PLACEMENTS,
  STYLE_PRESETS,
  validateExportStyle,
  type ExportDetails,
  type ExportStyle,
  type ExportStyleInput,
  type StylePreset,
} from '@richardmcquiston01/ats-resume-export';

/** Settings section that holds the export options, e.g. `hiredHand.export.fontSize`. */
export const EXPORT_SETTINGS_SECTION = 'hiredHand.export';

/** The `preset` setting: this extension's own look, or one of the shared package's presets. */
export type PresetSetting = 'classic' | StylePreset;

export const PRESET_SETTINGS: readonly PresetSetting[] = ['classic', ...STYLE_PRESETS];

export const DEFAULT_PRESET: PresetSetting = 'classic';

/**
 * Where a project's link goes by default. Exports have always printed it, so it stays on by
 * default: on its own line, since the shared exporters no longer append it to the description.
 */
export const DEFAULT_PROJECT_LINKS = 'below';

type DetailSettingKey = keyof ExportDetails;

interface DetailSetting {
  key: DetailSettingKey;
  allowed: readonly string[];
  fallback: string;
}

/**
 * The settings that choose whether an entry detail is printed and where. Project links are on
 * by default (exports have always shown them); the details added to resume.json later are off
 * until asked for, so existing exports do not change.
 */
const DETAIL_SETTINGS: readonly DetailSetting[] = [
  { key: 'projectLinks', allowed: DETAIL_PLACEMENTS, fallback: DEFAULT_PROJECT_LINKS },
  { key: 'projectTechStack', allowed: DETAIL_PLACEMENTS, fallback: 'off' },
  { key: 'projectOutcome', allowed: OUTCOME_PLACEMENTS, fallback: 'off' },
  { key: 'credentialUrl', allowed: DETAIL_PLACEMENTS, fallback: 'off' },
];

/**
 * Approximates how this extension's HTML, DOCX, and PDF exports looked before they moved to
 * the shared package: Arial/Helvetica, a 20 pt name over 13 pt section headings, 10 pt body
 * text, 1.3 line height, and 0.75 inch margins. The three formats were never identical, so
 * this is a single style that sits close to all of them.
 */
export const CLASSIC_STYLE: ExportStyle = {
  fontFamily: 'sans-serif',
  fontSize: 10,
  nameFontSize: 20,
  headingFontSize: 13,
  lineSpacing: 1.3,
  sectionSpacing: 12,
  entrySpacing: 6,
  margin: 54,
  headingCase: 'title',
};

/** The individual options that can override the preset (every setting except `preset`). */
const OVERRIDE_KEYS = [
  'fontFamily',
  'fontSize',
  'nameFontSize',
  'headingFontSize',
  'lineSpacing',
  'sectionSpacing',
  'entrySpacing',
  'margin',
  'pageSize',
  'headingCase',
] as const;

type OverrideKey = (typeof OVERRIDE_KEYS)[number];

/** Raw values as read from the settings. An empty string, null, or undefined means "not set". */
export type ExportSettingValues = { preset?: string | null } & {
  [Key in DetailSettingKey]?: unknown;
} & {
  [Key in OverrideKey]?: unknown;
};

export interface ResolvedExportSettings {
  /** Always valid, so it can be passed straight to the exporters. */
  style: ExportStyleInput;
  /** Which project and certification details to print, and where. */
  details: ExportDetails;
  /** Settings that were ignored, each with the setting name and why. Empty when all were fine. */
  problems: string[];
  /** Readability notes about valid-but-risky choices (these never block an export). */
  warnings: string[];
}

function isUnset(value: unknown): boolean {
  return value === undefined || value === null || value === '';
}

function isPresetSetting(value: unknown): value is PresetSetting {
  return typeof value === 'string' && (PRESET_SETTINGS as readonly string[]).includes(value);
}

function buildStyle(
  preset: PresetSetting,
  overrides: Partial<Record<OverrideKey, unknown>>,
): ExportStyleInput {
  const base: ExportStyleInput = preset === 'classic' ? { ...CLASSIC_STYLE } : { preset };
  return { ...base, ...overrides } as ExportStyleInput;
}

/**
 * Turns the raw settings into a style the exporters accept. A setting with an invalid value
 * is ignored (and reported) rather than failing the export, so a typo in settings.json never
 * blocks someone from getting their resume out.
 */
export function resolveExportSettings(values: ExportSettingValues): ResolvedExportSettings {
  const problems: string[] = [];

  let preset: PresetSetting = DEFAULT_PRESET;
  if (!isUnset(values.preset)) {
    if (isPresetSetting(values.preset)) {
      preset = values.preset;
    } else {
      problems.push(
        `${EXPORT_SETTINGS_SECTION}.preset: unknown preset "${String(values.preset)}"; using "${DEFAULT_PRESET}" instead. ` +
          `Use one of: ${PRESET_SETTINGS.join(', ')}.`,
      );
    }
  }

  const details: Record<string, string> = {};
  for (const { key, allowed, fallback } of DETAIL_SETTINGS) {
    const value = values[key];
    if (isUnset(value)) {
      details[key] = fallback;
    } else if (typeof value === 'string' && allowed.includes(value)) {
      details[key] = value;
    } else {
      details[key] = fallback;
      problems.push(
        `${EXPORT_SETTINGS_SECTION}.${key}: unknown placement "${String(value)}"; ` +
          `using "${fallback}" instead. Use one of: ${allowed.join(', ')}.`,
      );
    }
  }

  const overrides: Partial<Record<OverrideKey, unknown>> = {};
  for (const key of OVERRIDE_KEYS) {
    if (!isUnset(values[key])) {
      overrides[key] = values[key];
    }
  }

  // Drop each invalid override and say why. The preset alone is always valid, so this settles.
  for (let attempt = 0; attempt <= OVERRIDE_KEYS.length; attempt += 1) {
    const issues = validateExportStyle(buildStyle(preset, overrides));
    if (issues.length === 0) {
      break;
    }
    for (const issue of issues) {
      const key = issue.path[0];
      if (typeof key === 'string' && key in overrides) {
        delete overrides[key as OverrideKey];
        problems.push(
          `${EXPORT_SETTINGS_SECTION}.${key}: ${issue.message} This setting was ignored.`,
        );
      }
    }
  }

  const style = buildStyle(preset, overrides);
  const warnings = checkExportStyle(style).map((finding) => finding.message);
  return { style, details: details as ExportDetails, problems, warnings };
}
