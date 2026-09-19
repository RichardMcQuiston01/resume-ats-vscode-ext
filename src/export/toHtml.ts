import type { ResumeData } from '../resume/types';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function highlightsList(highlights: string[]): string {
  if (highlights.length === 0) {
    return '';
  }
  const items = highlights.map((highlight) => `<li>${escapeHtml(highlight)}</li>`).join('');
  return `<ul>${items}</ul>`;
}

function contactLine(resume: ResumeData): string {
  const parts = [
    resume.contact.email,
    resume.contact.phone,
    resume.contact.location,
    resume.contact.linkedInUrl,
    resume.contact.portfolioUrl,
  ]
    .filter((part) => part.trim().length > 0)
    .map(escapeHtml);
  return parts.length > 0 ? `<p class="contact">${parts.join(' &middot; ')}</p>` : '';
}

// Single-column, no tables/images — the layout an ATS parser can read reliably.
export function resumeToHtml(resume: ResumeData): string {
  const name = resume.contact.fullName.trim().length > 0 ? resume.contact.fullName : 'Untitled';
  const sections: string[] = [];

  if (resume.summary.trim().length > 0) {
    sections.push(`<section><h2>Summary</h2><p>${escapeHtml(resume.summary)}</p></section>`);
  }

  if (resume.experience.length > 0) {
    const entries = resume.experience
      .map((entry) => {
        const meta = [entry.location, `${entry.startDate} – ${entry.endDate}`]
          .filter((part) => part.trim().length > 0)
          .map(escapeHtml)
          .join(' &middot; ');
        return `<article>
          <h3>${escapeHtml(entry.jobTitle)} &mdash; ${escapeHtml(entry.employer)}</h3>
          <p class="meta">${meta}</p>
          ${highlightsList(entry.highlights)}
        </article>`;
      })
      .join('');
    sections.push(`<section><h2>Experience</h2>${entries}</section>`);
  }

  if (resume.education.length > 0) {
    const entries = resume.education
      .map((entry) => {
        const meta = [entry.institution, entry.graduationDate, entry.gpa ? `GPA: ${entry.gpa}` : '']
          .filter((part) => part.trim().length > 0)
          .map(escapeHtml)
          .join(' &middot; ');
        const degree = entry.fieldOfStudy
          ? `${escapeHtml(entry.degree)}, ${escapeHtml(entry.fieldOfStudy)}`
          : escapeHtml(entry.degree);
        return `<article><h3>${degree}</h3><p class="meta">${meta}</p></article>`;
      })
      .join('');
    sections.push(`<section><h2>Education</h2>${entries}</section>`);
  }

  if (resume.skills.length > 0) {
    const items = resume.skills
      .map(
        (group) =>
          `<li><strong>${escapeHtml(group.category)}:</strong> ${escapeHtml(group.skills.join(', '))}</li>`,
      )
      .join('');
    sections.push(`<section><h2>Skills</h2><ul>${items}</ul></section>`);
  }

  if (resume.certifications.length > 0) {
    const items = resume.certifications
      .map(
        (entry) =>
          `<li>${escapeHtml(entry.name)} &mdash; ${escapeHtml(entry.issuer)} (${escapeHtml(entry.issueDate)})</li>`,
      )
      .join('');
    sections.push(`<section><h2>Certifications</h2><ul>${items}</ul></section>`);
  }

  if (resume.projects.length > 0) {
    const entries = resume.projects
      .map((entry) => {
        const meta = [entry.description, entry.url]
          .filter((part) => part.trim().length > 0)
          .map(escapeHtml)
          .join(' &mdash; ');
        return `<article>
          <h3>${escapeHtml(entry.name)}</h3>
          <p class="meta">${meta}</p>
          ${highlightsList(entry.highlights)}
        </article>`;
      })
      .join('');
    sections.push(`<section><h2>Projects</h2>${entries}</section>`);
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(name)}</title>
<style>
  body { font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; max-width: 800px; margin: 0 auto; padding: 32px 16px; }
  h1 { margin-bottom: 4px; }
  h2 { border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-top: 24px; }
  .contact { color: #444; margin-top: 0; }
  .meta { color: #555; font-style: italic; margin: 2px 0 6px; }
  ul { margin: 4px 0; padding-left: 20px; }
</style>
</head>
<body>
<h1>${escapeHtml(name)}</h1>
${contactLine(resume)}
${sections.join('\n')}
</body>
</html>
`;
}
