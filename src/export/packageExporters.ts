import { exportResumeAsHtml, type StyleOption } from '@richardmcquiston01/ats-resume-export';
import { exportResumeAsDocx } from '@richardmcquiston01/ats-resume-export/docx';
import { exportResumeAsPdf } from '@richardmcquiston01/ats-resume-export/pdf';
import type { ResumeData } from '../resume/types';
import { toPackageResume } from '../resume/toPackageResume';

// The HTML, DOCX, and PDF exports come from the shared @richardmcquiston01/ats-resume-export
// package. This extension keeps `**bold**` / `*italic*` markers in highlights, so rich text is
// always on, and the user's chosen section order travels with the converted resume.

export function resumeToHtml(resume: ResumeData, style: StyleOption): string {
  return exportResumeAsHtml(toPackageResume(resume), { richText: true, style });
}

async function blobToBuffer(blob: Blob): Promise<Buffer> {
  return Buffer.from(await blob.arrayBuffer());
}

export async function resumeToDocxBuffer(resume: ResumeData, style: StyleOption): Promise<Buffer> {
  return blobToBuffer(await exportResumeAsDocx(toPackageResume(resume), { richText: true, style }));
}

export async function resumeToPdfBuffer(resume: ResumeData, style: StyleOption): Promise<Buffer> {
  return blobToBuffer(await exportResumeAsPdf(toPackageResume(resume), { richText: true, style }));
}
