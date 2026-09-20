import { createDefaultResume } from '../resume/template';
import { validateResumeData } from '../resume/validate';
import type {
  CertificationEntry,
  EducationEntry,
  ExperienceEntry,
  ProjectEntry,
  ResumeData,
  SkillGroup,
} from '../resume/types';
import type {
  ExtensionToWebviewMessage,
  WebviewToExtensionMessage,
} from '../resumeEditor/messages';
import {
  emptyCertificationEntry,
  emptyEducationEntry,
  emptyExperienceEntry,
  emptyProjectEntry,
  emptySkillGroup,
  formatHighlightsText,
  formatSkillList,
  moveArrayItem,
  parseHighlightsText,
  parseSkillList,
} from './formState';

declare function acquireVsCodeApi(): {
  postMessage(message: WebviewToExtensionMessage): void;
};

const vscodeApi = acquireVsCodeApi();

let resume: ResumeData = createDefaultResume();

function byId<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Hired Hand: missing expected element #${id}`);
  }
  return element as T;
}

function textField(label: string, value: string, onChange: (value: string) => void): HTMLElement {
  const wrapper = document.createElement('label');
  wrapper.textContent = label;
  const input = document.createElement('input');
  input.type = 'text';
  input.value = value;
  input.addEventListener('input', () => onChange(input.value));
  wrapper.appendChild(input);
  return wrapper;
}

function textAreaField(
  label: string,
  value: string,
  onChange: (value: string) => void,
): HTMLElement {
  const wrapper = document.createElement('label');
  wrapper.textContent = label;
  const textarea = document.createElement('textarea');
  textarea.rows = 3;
  textarea.value = value;
  textarea.addEventListener('input', () => onChange(textarea.value));
  wrapper.appendChild(textarea);
  return wrapper;
}

function removeButton(onClick: () => void): HTMLElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = 'Remove';
  button.addEventListener('click', onClick);
  return button;
}

function entryControls(options: {
  disableUp: boolean;
  disableDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'entry-controls';

  const upButton = document.createElement('button');
  upButton.type = 'button';
  upButton.textContent = '▲';
  upButton.title = 'Move up';
  upButton.setAttribute('aria-label', 'Move up');
  upButton.disabled = options.disableUp;
  upButton.addEventListener('click', options.onMoveUp);

  const downButton = document.createElement('button');
  downButton.type = 'button';
  downButton.textContent = '▼';
  downButton.title = 'Move down';
  downButton.setAttribute('aria-label', 'Move down');
  downButton.disabled = options.disableDown;
  downButton.addEventListener('click', options.onMoveDown);

  wrapper.appendChild(upButton);
  wrapper.appendChild(downButton);
  wrapper.appendChild(removeButton(options.onRemove));
  return wrapper;
}

function bindContactAndSummary(): void {
  const contactFields: Array<keyof ResumeData['contact']> = [
    'fullName',
    'email',
    'phone',
    'location',
    'linkedInUrl',
    'portfolioUrl',
  ];
  for (const field of contactFields) {
    const input = byId<HTMLInputElement>(`contact-${field}`);
    input.value = resume.contact[field];
    input.oninput = (): void => {
      resume.contact[field] = input.value;
    };
  }

  const summary = byId<HTMLTextAreaElement>('summary');
  summary.value = resume.summary;
  summary.oninput = (): void => {
    resume.summary = summary.value;
  };
}

function renderEducation(): void {
  const list = byId<HTMLDivElement>('education-list');
  list.innerHTML = '';
  resume.education.forEach((entry: EducationEntry, index: number) => {
    const row = document.createElement('div');
    row.className = 'entry';
    row.appendChild(
      textField('Institution', entry.institution, (value) => {
        resume.education[index].institution = value;
      }),
    );
    row.appendChild(
      textField('Degree', entry.degree, (value) => {
        resume.education[index].degree = value;
      }),
    );
    row.appendChild(
      textField('Field of study', entry.fieldOfStudy, (value) => {
        resume.education[index].fieldOfStudy = value;
      }),
    );
    row.appendChild(
      textField('Graduation date', entry.graduationDate, (value) => {
        resume.education[index].graduationDate = value;
      }),
    );
    row.appendChild(
      textField('GPA', entry.gpa, (value) => {
        resume.education[index].gpa = value;
      }),
    );
    row.appendChild(
      entryControls({
        disableUp: index === 0,
        disableDown: index === resume.education.length - 1,
        onMoveUp: () => {
          moveArrayItem(resume.education, index, 'up');
          renderEducation();
        },
        onMoveDown: () => {
          moveArrayItem(resume.education, index, 'down');
          renderEducation();
        },
        onRemove: () => {
          resume.education.splice(index, 1);
          renderEducation();
        },
      }),
    );
    list.appendChild(row);
  });
}

function renderExperience(): void {
  const list = byId<HTMLDivElement>('experience-list');
  list.innerHTML = '';
  resume.experience.forEach((entry: ExperienceEntry, index: number) => {
    const row = document.createElement('div');
    row.className = 'entry';
    row.appendChild(
      textField('Job title', entry.jobTitle, (value) => {
        resume.experience[index].jobTitle = value;
      }),
    );
    row.appendChild(
      textField('Employer', entry.employer, (value) => {
        resume.experience[index].employer = value;
      }),
    );
    row.appendChild(
      textField('Location', entry.location, (value) => {
        resume.experience[index].location = value;
      }),
    );
    row.appendChild(
      textField('Start date', entry.startDate, (value) => {
        resume.experience[index].startDate = value;
      }),
    );
    row.appendChild(
      textField('End date', entry.endDate, (value) => {
        resume.experience[index].endDate = value;
      }),
    );
    row.appendChild(
      textAreaField(
        'Highlights (one per line)',
        formatHighlightsText(entry.highlights),
        (value) => {
          resume.experience[index].highlights = parseHighlightsText(value);
        },
      ),
    );
    row.appendChild(
      entryControls({
        disableUp: index === 0,
        disableDown: index === resume.experience.length - 1,
        onMoveUp: () => {
          moveArrayItem(resume.experience, index, 'up');
          renderExperience();
        },
        onMoveDown: () => {
          moveArrayItem(resume.experience, index, 'down');
          renderExperience();
        },
        onRemove: () => {
          resume.experience.splice(index, 1);
          renderExperience();
        },
      }),
    );
    list.appendChild(row);
  });
}

function renderSkills(): void {
  const list = byId<HTMLDivElement>('skills-list');
  list.innerHTML = '';
  resume.skills.forEach((entry: SkillGroup, index: number) => {
    const row = document.createElement('div');
    row.className = 'entry';
    row.appendChild(
      textField('Category', entry.category, (value) => {
        resume.skills[index].category = value;
      }),
    );
    row.appendChild(
      textField('Skills (comma-separated)', formatSkillList(entry.skills), (value) => {
        resume.skills[index].skills = parseSkillList(value);
      }),
    );
    row.appendChild(
      entryControls({
        disableUp: index === 0,
        disableDown: index === resume.skills.length - 1,
        onMoveUp: () => {
          moveArrayItem(resume.skills, index, 'up');
          renderSkills();
        },
        onMoveDown: () => {
          moveArrayItem(resume.skills, index, 'down');
          renderSkills();
        },
        onRemove: () => {
          resume.skills.splice(index, 1);
          renderSkills();
        },
      }),
    );
    list.appendChild(row);
  });
}

function renderCertifications(): void {
  const list = byId<HTMLDivElement>('certifications-list');
  list.innerHTML = '';
  resume.certifications.forEach((entry: CertificationEntry, index: number) => {
    const row = document.createElement('div');
    row.className = 'entry';
    row.appendChild(
      textField('Name', entry.name, (value) => {
        resume.certifications[index].name = value;
      }),
    );
    row.appendChild(
      textField('Issuer', entry.issuer, (value) => {
        resume.certifications[index].issuer = value;
      }),
    );
    row.appendChild(
      textField('Issue date', entry.issueDate, (value) => {
        resume.certifications[index].issueDate = value;
      }),
    );
    row.appendChild(
      entryControls({
        disableUp: index === 0,
        disableDown: index === resume.certifications.length - 1,
        onMoveUp: () => {
          moveArrayItem(resume.certifications, index, 'up');
          renderCertifications();
        },
        onMoveDown: () => {
          moveArrayItem(resume.certifications, index, 'down');
          renderCertifications();
        },
        onRemove: () => {
          resume.certifications.splice(index, 1);
          renderCertifications();
        },
      }),
    );
    list.appendChild(row);
  });
}

function renderProjects(): void {
  const list = byId<HTMLDivElement>('projects-list');
  list.innerHTML = '';
  resume.projects.forEach((entry: ProjectEntry, index: number) => {
    const row = document.createElement('div');
    row.className = 'entry';
    row.appendChild(
      textField('Name', entry.name, (value) => {
        resume.projects[index].name = value;
      }),
    );
    row.appendChild(
      textField('Description', entry.description, (value) => {
        resume.projects[index].description = value;
      }),
    );
    row.appendChild(
      textField('URL', entry.url, (value) => {
        resume.projects[index].url = value;
      }),
    );
    row.appendChild(
      textAreaField(
        'Highlights (one per line)',
        formatHighlightsText(entry.highlights),
        (value) => {
          resume.projects[index].highlights = parseHighlightsText(value);
        },
      ),
    );
    row.appendChild(
      entryControls({
        disableUp: index === 0,
        disableDown: index === resume.projects.length - 1,
        onMoveUp: () => {
          moveArrayItem(resume.projects, index, 'up');
          renderProjects();
        },
        onMoveDown: () => {
          moveArrayItem(resume.projects, index, 'down');
          renderProjects();
        },
        onRemove: () => {
          resume.projects.splice(index, 1);
          renderProjects();
        },
      }),
    );
    list.appendChild(row);
  });
}

function renderAllLists(): void {
  renderEducation();
  renderExperience();
  renderSkills();
  renderCertifications();
  renderProjects();
}

function setStatus(text: string): void {
  byId<HTMLParagraphElement>('status').textContent = text;
}

function main(): void {
  bindContactAndSummary();
  renderAllLists();

  byId<HTMLButtonElement>('education-add').addEventListener('click', () => {
    resume.education.push(emptyEducationEntry());
    renderEducation();
  });
  byId<HTMLButtonElement>('experience-add').addEventListener('click', () => {
    resume.experience.push(emptyExperienceEntry());
    renderExperience();
  });
  byId<HTMLButtonElement>('skills-add').addEventListener('click', () => {
    resume.skills.push(emptySkillGroup());
    renderSkills();
  });
  byId<HTMLButtonElement>('certifications-add').addEventListener('click', () => {
    resume.certifications.push(emptyCertificationEntry());
    renderCertifications();
  });
  byId<HTMLButtonElement>('projects-add').addEventListener('click', () => {
    resume.projects.push(emptyProjectEntry());
    renderProjects();
  });

  const performSave = (): void => {
    const result = validateResumeData(resume);
    if (!result.valid) {
      setStatus(`Cannot save: ${result.errors[0]}`);
      return;
    }
    setStatus('Saving...');
    vscodeApi.postMessage({ type: 'saveRequest', resume });
  };
  byId<HTMLButtonElement>('save-top').addEventListener('click', performSave);
  byId<HTMLButtonElement>('save-bottom').addEventListener('click', performSave);

  byId<HTMLButtonElement>('jump-to-top').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  window.addEventListener('message', (event: MessageEvent<ExtensionToWebviewMessage>) => {
    const message = event.data;
    if (message.type === 'load') {
      resume = message.resume;
      bindContactAndSummary();
      renderAllLists();
      setStatus('');
    } else if (message.type === 'saved') {
      setStatus('Saved.');
    } else if (message.type === 'saveError') {
      setStatus(`Save failed: ${message.errors[0]}`);
    }
  });
}

main();
