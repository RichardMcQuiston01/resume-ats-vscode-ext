import { createHash } from 'node:crypto';
import type { Resume } from '@richardmcquiston01/ats-resume-export';
import type { ResumeData } from './types';
import { resolveSectionOrder } from './sections';

// Adapter from this extension's flat resume.json shape to the shared
// @richardmcquiston01/ats-resume-export `Resume` model, so the ATS checks and
// exporters in that package can be run against a resume.json.
//
// The mapping is one-way and lossy by design:
//  - `sectionOrder` is passed through (resolved by this extension's own rules), and
//    the package's exporters honor it.
//  - Highlights keep their `**bold**` / `*italic*` markers; export with
//    `richText: true` to render them as styled text.
//  - A project's URL is mapped to `url`; the exporters print it where the
//    `hiredHand.export.projectLinks` setting says (see exportStyle.ts).
//  - Only the explicit "Present" end date means current; a blank end date stays
//    blank so the package's checks still flag the incomplete entry.
//  - The flat shape has no ids, so stable ones are derived from each entity's
//    position (see stableId); reordering entries therefore changes their ids.

export interface ToPackageResumeOptions {
  /** Timestamp for `createdAt` / `updatedAt`. Defaults to the current time. */
  now?: Date;
}

const PRESENT_SENTINEL = 'Present';

/**
 * Deterministic RFC 4122 version-5 style UUID derived from `path`, so converting
 * the same resume twice yields identical ids (stable diffs, reproducible tests).
 */
function stableId(path: string): string {
  const bytes: Buffer = createHash('sha1').update(`ats-resume-vscode-ext:${path}`).digest();
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex: string = bytes.subarray(0, 16).toString('hex');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

function isBlank(value: string): boolean {
  return value.trim().length === 0;
}

/** Returns `value` trimmed, or `undefined` when it is empty (to omit optional fields). */
function optional(value: string): string | undefined {
  return isBlank(value) ? undefined : value.trim();
}

function buildCredential(degree: string, fieldOfStudy: string): string {
  return [degree, fieldOfStudy]
    .filter((part: string) => !isBlank(part))
    .map((part: string) => part.trim())
    .join(', ');
}

export function toPackageResume(data: ResumeData, options: ToPackageResumeOptions = {}): Resume {
  const timestamp: string = (options.now ?? new Date()).toISOString();
  const links: Resume['contact']['links'] = [];
  const linkedInUrl: string | undefined = optional(data.contact.linkedInUrl);
  const portfolioUrl: string | undefined = optional(data.contact.portfolioUrl);
  if (linkedInUrl !== undefined) {
    links.push({ id: stableId('contact.linkedIn'), label: 'LinkedIn', url: linkedInUrl });
  }
  if (portfolioUrl !== undefined) {
    links.push({ id: stableId('contact.portfolio'), label: 'Portfolio', url: portfolioUrl });
  }

  return {
    schemaVersion: 1,
    id: stableId('resume'),
    createdAt: timestamp,
    updatedAt: timestamp,
    contact: {
      fullName: data.contact.fullName.trim(),
      email: data.contact.email.trim(),
      phone: optional(data.contact.phone),
      location: optional(data.contact.location),
      links,
    },
    summary: optional(data.summary),
    experience: data.experience.map((entry, index) => {
      const isCurrent: boolean = entry.endDate === PRESENT_SENTINEL;
      return {
        id: stableId(`experience.${index}`),
        company: entry.employer.trim(),
        title: entry.jobTitle.trim(),
        location: optional(entry.location),
        startDate: entry.startDate,
        endDate: isCurrent ? undefined : optional(entry.endDate),
        isCurrent,
        highlights: [...entry.highlights],
      };
    }),
    education: data.education.map((entry, index) => ({
      id: stableId(`education.${index}`),
      institution: entry.institution.trim(),
      credential: buildCredential(entry.degree, entry.fieldOfStudy),
      location: undefined,
      startDate: undefined,
      endDate: optional(entry.graduationDate),
      isCurrent: false,
      highlights: isBlank(entry.gpa) ? [] : [`GPA: ${entry.gpa.trim()}`],
    })),
    skills: data.skills.map((group, index) => ({
      id: stableId(`skills.${index}`),
      category: group.category.trim(),
      skills: [...group.skills],
    })),
    certifications: data.certifications.map((entry, index) => ({
      id: stableId(`certifications.${index}`),
      name: entry.name.trim(),
      issuer: entry.issuer.trim(),
      issueDate: optional(entry.issueDate),
      expirationDate: undefined,
      credentialUrl: optional(entry.credentialUrl),
    })),
    projects: data.projects.map((entry, index) => ({
      id: stableId(`projects.${index}`),
      name: entry.name.trim(),
      description: entry.description.trim(),
      url: optional(entry.url),
      highlights: [...entry.highlights],
      techStack: entry.techStack.map((tech) => tech.trim()).filter((tech) => tech.length > 0),
      repoUrl: optional(entry.repoUrl),
      demoUrl: optional(entry.demoUrl),
      outcome: optional(entry.outcome),
      screenshots: [],
    })),
    portfolio: { featuredProjectIds: [], recommendations: [] },
    sectionOrder: resolveSectionOrder(data),
  };
}
