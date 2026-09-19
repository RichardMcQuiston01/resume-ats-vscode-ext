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
    certifications: [{ name: 'AWS Certified', issuer: 'AWS', issueDate: '2021-01' }],
    projects: [
      {
        name: 'Side Project',
        description: 'A useful tool.',
        url: 'https://example.com',
        highlights: ['Built with TypeScript'],
      },
    ],
  };
}
