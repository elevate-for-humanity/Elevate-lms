export const dynamic = 'force-static';
export const revalidate = 86400;
import { Metadata } from 'next';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';
import ProgramPageLayout from '@/components/programs/ProgramPageLayout';
import type { ProgramPageConfig } from '@/components/programs/ProgramPageLayout';
const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Software Development Foundations | IT Specialist Certified | Indianapolis',
  description: 'Earn the Certiport IT Specialist — Software Development certification. 12-week program. 5-Star Top Job. Average salary $104,000+.',
  alternates: { canonical: `${SITE_URL}/programs/software-development` },
};

const config: ProgramPageConfig = {
  videoSrc: '/videos/it-technology.mp4',
  title: 'Software Development Foundations',
  subtitle: 'Learn Python, JavaScript, and software engineering fundamentals. Earn the IT Specialist certification in 12 weeks.',
  badge: '5-Star Top Job — DWD',
  badgeColor: 'purple',
  duration: '12 weeks',
  cost: '$5,200 (WorkOne funding available)',
  format: 'In-person, Indianapolis',
  credential: 'IT Specialist — Software Development',
  overview: 'This 12-week program covers programming fundamentals using Python and JavaScript. You will learn data structures, algorithms, version control, and software development methodologies. Graduates earn the Certiport IT Specialist — Software Development certification and are prepared for entry-level developer and QA positions.',
  highlights: ['Python programming from fundamentals to intermediate', 'JavaScript and web application basics', 'Data structures and algorithms', 'Git version control and collaboration', 'Certiport IT Specialist certification exam included', 'Portfolio of completed software projects'],
  overviewImage: '/images/programs-fresh/software-dev.jpg',
  overviewImageAlt: 'Student writing code on a laptop',
  salaryNumber: 104000,
  salaryLabel: 'Average annual salary for software developers in Indiana (BLS)',
  salaryPrefix: '$',
  curriculum: [
    { title: 'Python Fundamentals', topics: ['Variables and data types', 'Control flow and loops', 'Functions and modules', 'File I/O', 'Error handling'] },
    { title: 'Data Structures', topics: ['Lists, tuples, dictionaries', 'Stacks and queues', 'Sorting algorithms', 'Search algorithms', 'Big-O notation'] },
    { title: 'JavaScript Basics', topics: ['Syntax and operators', 'DOM manipulation', 'Event-driven programming', 'Fetch API and JSON', 'Async/await'] },
    { title: 'Software Engineering', topics: ['Agile methodology', 'Git and GitHub', 'Code review practices', 'Testing fundamentals', 'CI/CD concepts'] },
    { title: 'Project Development', topics: ['Requirements gathering', 'Application architecture', 'Full-stack mini project', 'Documentation', 'Presentation skills'] },
    { title: 'Certification Prep', topics: ['IT Specialist exam objectives', 'Practice exams', 'On-site Certiport testing', 'Resume and portfolio review', 'Career placement support'] },
  ],
  credentials: ['IT Specialist — Software Development (Certiport)', 'Certificate of Completion'],
  careers: [
    { title: 'Junior Software Developer', salary: '$55,000–$75,000' },
    { title: 'Python Developer', salary: '$65,000–$95,000' },
    { title: 'QA Analyst', salary: '$50,000–$70,000' },
    { title: 'Full-Stack Developer', salary: '$75,000–$110,000' },
    { title: 'DevOps Engineer', salary: '$80,000–$120,000' },
  ],
  steps: [
    { title: 'Apply Online', desc: 'Complete our application in about 5 minutes.' },
    { title: 'Check Funding', desc: 'Register at Indiana Career Connect for WIOA eligibility.' },
    { title: 'Attend Orientation', desc: 'Meet your instructor and tour the lab.' },
    { title: 'Start Coding', desc: 'Begin your 12-week software development program.' },
  ],
  faqs: [
    { question: 'Do I need coding experience?', answer: 'No. This program starts from zero. You will learn programming fundamentals step by step. Basic computer skills are the only prerequisite.' },
    { question: 'Is this a bootcamp?', answer: 'This is a structured 12-week certification program, not a bootcamp. You earn a nationally recognized Certiport IT Specialist credential, not just a certificate of attendance.' },
    { question: 'What jobs can I get after this?', answer: 'Entry-level positions include Junior Developer, QA Analyst, and Technical Support. Many graduates continue learning and advance to mid-level developer roles within 1-2 years.' },
  ],
  applyHref: '/apply?program=software-development',
  breadcrumbs: [{ label: 'Programs', href: '/programs' }, { label: 'Technology', href: '/programs/technology' }, { label: 'Software Development' }],
};

export default function Page() {
  return (<><ProgramStructuredData program={{ id: 'software-development', name: config.title, slug: 'software-development', description: config.subtitle, duration_weeks: 12, price: 5200, image_url: `${SITE_URL}/images/programs-fresh/software-dev.jpg`, category: 'Technology', outcomes: config.credentials || [] }} /><ProgramPageLayout config={config} /></>);
}
