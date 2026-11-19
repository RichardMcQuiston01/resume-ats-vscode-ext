import type { ResumeData } from '../../resume/types';

export function fullyPopulatedResume(): ResumeData {
  return {
    schemaVersion: 1,
    contact: {
      fullName: 'Jordan Smith',
      email: 'jordan@example.com',
      phone: '555-0100',
      location: 'Remote',
      linkedInUrl: 'https://linkedin.com/in/jordansmith',
      portfolioUrl: '',
    },
    summary: 'Experienced software engineer.',
    sectionOrder: ['experience', 'education', 'skills', 'certifications', 'projects'],
    education: [
      {
        institution: 'State University',
        degree: 'B.S.',
        fieldOfStudy: 'Computer Science',
        graduationDate: '2018-05',
        gpa: '3.8',
      },
    ],
    experience: [
      {
        jobTitle: 'Software Engineer',
        employer: 'Example Corp',
        location: 'Remote',
        startDate: '2018-06',
        endDate: 'Present',
        highlights: ['Shipped feature X', 'Reduced latency by 30%'],
      },
    ],
    skills: [{ category: 'Languages', skills: ['TypeScript', 'Go'] }],
    certifications: [
      { name: 'AWS Certified', issuer: 'AWS', issueDate: '2021-01', credentialUrl: '' },
    ],
    projects: [
      {
        name: 'Side Project',
        description: 'A useful tool.',
        url: 'https://example.com',
        repoUrl: '',
        demoUrl: '',
        techStack: [],
        outcome: '',
        highlights: ['Built with TypeScript'],
      },
    ],
  };
}

/** The fully populated resume, plus every project and certification detail filled in. */
export function resumeWithEntryDetails(): ResumeData {
  const resume = fullyPopulatedResume();
  resume.certifications[0]!.credentialUrl = 'https://verify.example.com/cert/42';
  Object.assign(resume.projects[0]!, {
    repoUrl: 'https://github.com/example/side-project',
    demoUrl: 'https://demo.example.com',
    techStack: ['TypeScript', 'Node.js'],
    outcome: 'Cut report time from 2 days to 2 hours.',
  });
  return resume;
}
