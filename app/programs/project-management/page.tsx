export const dynamic = 'force-static';
export const revalidate = 86400;
import { Metadata } from 'next';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';
import ProgramPageLayout from '@/components/programs/ProgramPageLayout';
import type { ProgramPageConfig } from '@/components/programs/ProgramPageLayout';
const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Project Management | Certiport Certified | Indianapolis',
  description: 'Earn the IT Specialist — Project Management certification. 8-week program. Project managers earn $95,370/year.',
  alternates: { canonical: `${SITE_URL}/programs/project-management` },
};

const config: ProgramPageConfig = {
  videoSrc: '/videos/it-technology.mp4',
  voiceoverSrc: '/audio/heroes/business.mp3',
  title: 'Project Management',
  subtitle: 'Plan, execute, and deliver projects on time and on budget. Earn the IT Specialist — Project Management certification in 8 weeks.',
  badge: '4-Star Top Job — DWD',
  badgeColor: 'blue',
  duration: '8 weeks',
  cost: '$4,550 (WorkOne funding available)',
  format: 'In-person, Indianapolis',
  credential: 'IT Specialist — Project Management',
  overview: 'This 8-week program covers project planning, scheduling, budgeting, risk management, and team leadership. You will use Microsoft Project and Agile tools to manage simulated projects from initiation to close-out. Graduates earn the Certiport IT Specialist — Project Management certification.',
  highlights: ['Project lifecycle from initiation to close-out', 'Microsoft Project scheduling and tracking', 'Agile and Scrum methodology', 'Risk management and mitigation', 'Certiport certification exam included', 'Simulated project management experience'],
  overviewImage: '/images/programs-fresh/project-management.jpg',
  overviewImageAlt: 'Team collaborating on a project plan',
  salaryNumber: 95370,
  salaryLabel: 'Average annual salary for project managers (BLS)',
  salaryPrefix: '$',
  curriculum: [
    { title: 'Project Fundamentals', topics: ['Project lifecycle phases', 'Stakeholder identification', 'Scope definition', 'Work breakdown structure', 'Project charter'] },
    { title: 'Planning & Scheduling', topics: ['Microsoft Project basics', 'Gantt charts and timelines', 'Critical path method', 'Resource allocation', 'Milestone tracking'] },
    { title: 'Agile & Scrum', topics: ['Agile manifesto and principles', 'Scrum roles and ceremonies', 'Sprint planning and retrospectives', 'Kanban boards', 'User stories and backlog'] },
    { title: 'Budget & Risk', topics: ['Cost estimation methods', 'Budget tracking', 'Risk identification', 'Risk mitigation strategies', 'Change management'] },
    { title: 'Certification Prep', topics: ['IT Specialist exam objectives', 'Practice exams', 'On-site Certiport testing', 'Resume and interview prep', 'Career placement support'] },
  ],
  credentials: ['IT Specialist — Project Management (Certiport)', 'Certificate of Completion'],
  careers: [
    { title: 'Project Coordinator', salary: '$50,000–$65,000' },
    { title: 'Project Manager', salary: '$70,000–$110,000' },
    { title: 'Scrum Master', salary: '$80,000–$120,000' },
    { title: 'Program Manager', salary: '$90,000–$130,000' },
  ],
  steps: [
    { title: 'Apply Online', desc: 'Complete our application in about 5 minutes.' },
    { title: 'Check Funding', desc: 'Register at Indiana Career Connect for WIOA eligibility.' },
    { title: 'Attend Orientation', desc: 'Meet your instructor and review the program.' },
    { title: 'Start Training', desc: 'Begin your 8-week project management program.' },
  ],
  faqs: [
    { question: 'Do I need project management experience?', answer: 'No. This program teaches project management from the fundamentals. If you have organized any kind of work or event, you already have transferable skills.' },
    { question: 'Is this the same as PMP?', answer: 'No. PMP requires 3-5 years of experience. This program earns you the Certiport IT Specialist — Project Management certification, which is an entry-level credential. It prepares you for the PMP path.' },
  ],
  applyHref: '/apply?program=project-management',
  breadcrumbs: [{ label: 'Programs', href: '/programs' }, { label: 'Technology', href: '/programs/technology' }, { label: 'Project Management' }],
};

export default function Page() {
  return (<><ProgramStructuredData program={{ id: 'project-management', name: config.title, slug: 'project-management', description: config.subtitle, duration_weeks: 8, price: 4550, image_url: `${SITE_URL}/images/programs-fresh/project-management.jpg`, category: 'Technology', outcomes: config.credentials || [] }} /><ProgramPageLayout config={config} /></>);
}
