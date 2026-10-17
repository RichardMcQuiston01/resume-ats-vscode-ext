import {
  exportResumeAsHtml,
  type ExportDetails,
  type ExportOptions,
  type StyleOption,
} from '@richardmcquiston01/ats-resume-export';
import { exportResumeAsDocx } from '@richardmcquiston01/ats-resume-export/docx';
import { exportResumeAsPdf } from '@richardmcquiston01/ats-resume-export/pdf';
import type { ResumeData } from '../resume/types';
import { toPackageResume } from '../resume/toPackageResume';

// The HTML, DOCX, and PDF exports come from the shared @richardmcquiston01/ats-resume-export
// package. This extension keeps `**bold**` / `*italic*` markers in highlights, so rich text is
// always on, and the user's chosen section order travels with the converted resume.

/** How an export looks (`style`) and which entry details it prints (`details`). */
export interface PackageExportOptions {
  style: StyleOption;
  details?: ExportDetails;
}

export function resumeToHtml(
  resume: ResumeData,
  style: StyleOption,
  details?: ExportDetails,
): string {
  return exportResumeAsHtml(
    toPackageResume(resume),
    withOptional({ richText: true, style }, details),
  );
}

async function blobToBuffer(blob: Blob): Promise<Buffer> {
  return Buffer.from(await blob.arrayBuffer());
}

export async function resumeToDocxBuffer(
  resume: ResumeData,
  style: StyleOption,
  details?: ExportDetails,
): Promise<Buffer> {
  return blobToBuffer(
    await exportResumeAsDocx(
      toPackageResume(resume),
      withOptional({ richText: true, style }, details),
    ),
  );
}

export async function resumeToPdfBuffer(
  resume: ResumeData,
  style: StyleOption,
  details?: ExportDetails,
): Promise<Buffer> {
  return blobToBuffer(
    await exportResumeAsPdf(
      toPackageResume(resume),
      withOptional({ richText: true, style }, details),
    ),
  );
}

/** Adds `details` only when given, so an unset value never reaches the package as `undefined`. */
function withOptional(
  options: { richText: boolean; style: StyleOption },
  details: ExportDetails | undefined,
): ExportOptions {
  return details === undefined ? options : { ...options, details };
}
