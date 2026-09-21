import { createDefaultResume } from '../resume/template';
import { validateResumeData } from '../resume/validate';
import { getRequiredFieldErrors, type RequiredFieldError } from '../resume/requiredFields';
import { getFormatWarnings } from '../resume/formatWarnings';
import { DEFAULT_SECTION_ORDER, resolveSectionOrder } from '../resume/sections';
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

function textField(
  label: string,
  value: string,
  onChange: (value: string) => void,
  options: { required?: boolean } = {},
): HTMLElement {
  const wrapper = document.createElement('label');
  wrapper.textContent = label;
  if (options.required) {
    const marker = document.createElement('span');
    marker.className = 'required-marker';
    marker.textContent = ' *';
    wrapper.appendChild(marker);
  }
  const input = document.createElement('input');
  input.type = 'text';
  input.value = value;
  if (options.required) {
    input.dataset.required = 'true';
    input.classList.toggle('invalid', value.trim().length === 0);
  }
  input.addEventListener('input', () => onChange(input.value));
  wrapper.appendChild(input);
  return wrapper;
}

function monthField(label: string, value: string, onChange: (value: string) => void): HTMLElement {
  const wrapper = document.createElement('label');
  wrapper.textContent = label;
  const input = document.createElement('input');
  input.type = 'month';
  input.value = value;
  input.addEventListener('input', () => onChange(input.value));
  wrapper.appendChild(input);
  return wrapper;
}

function endDateField(index: number): HTMLElement {
  const container = document.createElement('div');

  const monthLabel = document.createElement('label');
  monthLabel.textContent = 'End date';
  const monthInput = document.createElement('input');
  monthInput.type = 'month';

  const presentLabel = document.createElement('label');
  presentLabel.className = 'present-checkbox';
  const presentCheckbox = document.createElement('input');
  presentCheckbox.type = 'checkbox';

  const isPresent = resume.experience[index].endDate === 'Present';
  monthInput.value = isPresent ? '' : resume.experience[index].endDate;
  monthInput.disabled = isPresent;
  presentCheckbox.checked = isPresent;

  monthInput.addEventListener('input', () => {
    resume.experience[index].endDate = monthInput.value;
  });
  presentCheckbox.addEventListener('change', () => {
    if (presentCheckbox.checked) {
      resume.experience[index].endDate = 'Present';
      monthInput.value = '';
      monthInput.disabled = true;
    } else {
      resume.experience[index].endDate = '';
      monthInput.disabled = false;
    }
  });

  monthLabel.appendChild(monthInput);
  presentLabel.appendChild(presentCheckbox);
  presentLabel.appendChild(document.createTextNode(' Present'));
  container.appendChild(monthLabel);
  container.appendChild(presentLabel);
  return container;
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

function wrapSelection(textarea: HTMLTextAreaElement, marker: string): void {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const before = textarea.value.slice(0, start);
  const selected = textarea.value.slice(start, end);
  const after = textarea.value.slice(end);
  textarea.value = `${before}${marker}${selected}${marker}${after}`;
  textarea.selectionStart = start + marker.length;
  textarea.selectionEnd = end + marker.length;
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  textarea.focus();
}

function highlightsField(
  label: string,
  value: string,
  onChange: (value: string) => void,
): HTMLElement {
  const wrapper = document.createElement('div');

  const field = textAreaField(label, value, onChange);
  const textarea = field.querySelector('textarea');
  if (!textarea) {
    throw new Error('Hired Hand: expected textAreaField to contain a textarea');
  }

  const toolbar = document.createElement('div');
  toolbar.className = 'rich-text-toolbar';

  const boldButton = document.createElement('button');
  boldButton.type = 'button';
  boldButton.className = 'rich-text-bold';
  boldButton.textContent = 'B';
  boldButton.title = 'Bold selected text';
  boldButton.setAttribute('aria-label', 'Bold selected text');
  boldButton.addEventListener('click', () => wrapSelection(textarea, '**'));

  const italicButton = document.createElement('button');
  italicButton.type = 'button';
  italicButton.className = 'rich-text-italic';
  italicButton.textContent = 'I';
  italicButton.title = 'Italicize selected text';
  italicButton.setAttribute('aria-label', 'Italicize selected text');
  italicButton.addEventListener('click', () => wrapSelection(textarea, '*'));

  toolbar.appendChild(boldButton);
  toolbar.appendChild(italicButton);

  wrapper.appendChild(toolbar);
  wrapper.appendChild(field);
  return wrapper;
}

const TRASH_ICON =
  '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 4h11M6 4V2.5h4V4M3.5 4l.6 9.5a1 1 0 0 0 1 .9h5.8a1 1 0 0 0 1-.9L12.5 4"/><path d="M6.5 6.5v5M9.5 6.5v5"/></svg>';

function removeButton(onClick: () => void): HTMLElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.innerHTML = `${TRASH_ICON}<span>Remove</span>`;
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
    if (input.dataset.required === 'true') {
      input.classList.toggle('invalid', input.value.trim().length === 0);
    }
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
      textField(
        'Institution',
        entry.institution,
        (value) => {
          resume.education[index].institution = value;
        },
        { required: true },
      ),
    );
    row.appendChild(
      textField(
        'Degree',
        entry.degree,
        (value) => {
          resume.education[index].degree = value;
        },
        { required: true },
      ),
    );
    row.appendChild(
      textField('Field of study', entry.fieldOfStudy, (value) => {
        resume.education[index].fieldOfStudy = value;
      }),
    );
    row.appendChild(
      monthField('Graduation date', entry.graduationDate, (value) => {
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
      textField(
        'Job title',
        entry.jobTitle,
        (value) => {
          resume.experience[index].jobTitle = value;
        },
        { required: true },
      ),
    );
    row.appendChild(
      textField(
        'Employer',
        entry.employer,
        (value) => {
          resume.experience[index].employer = value;
        },
        { required: true },
      ),
    );
    row.appendChild(
      textField('Location', entry.location, (value) => {
        resume.experience[index].location = value;
      }),
    );
    row.appendChild(
      monthField('Start date', entry.startDate, (value) => {
        resume.experience[index].startDate = value;
      }),
    );
    row.appendChild(endDateField(index));
    row.appendChild(
      highlightsField(
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
      monthField('Issue date', entry.issueDate, (value) => {
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
      highlightsField(
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

function applySectionOrder(): void {
  const container = byId<HTMLDivElement>('sections-container');
  const order = resolveSectionOrder(resume);
  resume.sectionOrder = order;
  order.forEach((key) => {
    container.appendChild(byId<HTMLElement>(`section-${key}`));
  });
  order.forEach((key, index) => {
    byId<HTMLButtonElement>(`${key}-move-up`).disabled = index === 0;
    byId<HTMLButtonElement>(`${key}-move-down`).disabled = index === order.length - 1;
  });
}

function bindSectionControls(): void {
  for (const key of DEFAULT_SECTION_ORDER) {
    byId<HTMLButtonElement>(`${key}-move-up`).addEventListener('click', () => {
      const order = resolveSectionOrder(resume);
      moveArrayItem(order, order.indexOf(key), 'up');
      resume.sectionOrder = order;
      applySectionOrder();
    });
    byId<HTMLButtonElement>(`${key}-move-down`).addEventListener('click', () => {
      const order = resolveSectionOrder(resume);
      moveArrayItem(order, order.indexOf(key), 'down');
      resume.sectionOrder = order;
      applySectionOrder();
    });
  }
}

function setStatus(text: string): void {
  byId<HTMLParagraphElement>('status').textContent = text;
}

function renderSaveFeedback(errors: RequiredFieldError[], warnings: string[]): void {
  const container = byId<HTMLDivElement>('save-feedback');
  container.innerHTML = '';
  for (const error of errors) {
    const line = document.createElement('p');
    line.className = 'save-feedback-error';
    line.textContent = `Error: ${error.message}`;
    container.appendChild(line);
  }
  for (const warning of warnings) {
    const line = document.createElement('p');
    line.className = 'save-feedback-warning';
    line.textContent = `Warning: ${warning}`;
    container.appendChild(line);
  }
}

function updateSaveState(): void {
  const errors = getRequiredFieldErrors(resume);
  const warnings = getFormatWarnings(resume);
  const canSave = errors.length === 0;
  byId<HTMLButtonElement>('save-top').disabled = !canSave;
  byId<HTMLButtonElement>('save-bottom').disabled = !canSave;
  setStatus(canSave ? '' : errors[0].message);
  renderSaveFeedback(errors, warnings);
}

function main(): void {
  bindContactAndSummary();
  renderAllLists();
  bindSectionControls();
  applySectionOrder();
  updateSaveState();

  document.addEventListener('input', (event) => {
    const target = event.target;
    if (target instanceof HTMLInputElement && target.dataset.required === 'true') {
      target.classList.toggle('invalid', target.value.trim().length === 0);
    }
    updateSaveState();
  });

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
    const requiredFieldErrors = getRequiredFieldErrors(resume);
    if (requiredFieldErrors.length > 0) {
      setStatus(`Cannot save: ${requiredFieldErrors[0].message}`);
      return;
    }
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
      applySectionOrder();
      updateSaveState();
    } else if (message.type === 'saved') {
      setStatus('Saved.');
    } else if (message.type === 'saveError') {
      setStatus(`Save failed: ${message.errors[0]}`);
    }
  });
}

main();
