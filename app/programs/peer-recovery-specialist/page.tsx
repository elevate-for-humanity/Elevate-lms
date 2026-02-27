export const dynamic = 'force-static';
export const revalidate = 86400;
import { Metadata } from 'next';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';
import ProgramPageLayout from '@/components/programs/ProgramPageLayout';
import type { ProgramPageConfig } from '@/components/programs/ProgramPageLayout';
const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Peer Recovery Specialist | Indiana Certified | Indianapolis',
  description: 'Become a Certified Peer Recovery Specialist. 6-week program. Help others overcome addiction and mental health challenges.',
  alternates: { canonical: `${SITE_URL}/programs/peer-recovery-specialist` },
};

const config: ProgramPageConfig = {
  videoSrc: '/videos/program-hero.mp4',
  title: 'Peer Recovery Specialist', subtitle: 'Use your lived experience to help others overcome addiction and mental health challenges. Earn Indiana certification in 6 weeks.',
  badge: 'Funding Available', badgeColor: 'green',
  duration: '6 weeks', cost: '$0 with WIOA funding', format: 'In-person, Indianapolis', credential: 'Indiana CPRS',
  overview: 'This 6-week program prepares you for the Indiana Certified Peer Recovery Specialist (CPRS) credential. You will learn recovery coaching, motivational interviewing, crisis intervention, and community resource navigation. This program is designed for individuals with lived experience in recovery from substance use or mental health challenges who want to help others on their journey.',
  highlights: ['Recovery coaching and mentoring techniques', 'Motivational interviewing skills', 'Crisis intervention and de-escalation', 'Community resource navigation', 'Indiana CPRS certification preparation', 'Supervised practicum hours'],
  overviewImage: '/images/programs-fresh/peer-recovery.jpg', overviewImageAlt: 'Peer recovery specialist in a counseling session',
  salaryNumber: 38000, salaryLabel: 'Average annual salary for peer recovery specialists in Indiana', salaryPrefix: '$',
  curriculum: [
    { title: 'Recovery Foundations', topics: ['Recovery models and principles', 'Stages of change', 'Person-centered approach', 'Cultural competency', 'Ethics and boundaries'] },
    { title: 'Coaching Skills', topics: ['Motivational interviewing', 'Active listening', 'Goal setting with clients', 'Strengths-based approach', 'Documentation and notes'] },
    { title: 'Crisis & Safety', topics: ['Crisis intervention techniques', 'De-escalation strategies', 'Suicide prevention awareness', 'Mandated reporting', 'Self-care for helpers'] },
    { title: 'Community Resources', topics: ['Treatment referral pathways', 'Housing and employment resources', 'Insurance and benefits navigation', 'Support group facilitation', 'Advocacy skills'] },
    { title: 'Certification Prep', topics: ['Indiana CPRS requirements', 'Practicum hours', 'Exam preparation', 'Application process', 'Career placement support'] },
  ],
  credentials: ['Indiana Certified Peer Recovery Specialist (CPRS)', 'CPR/First Aid', 'Certificate of Completion'],
  careers: [
    { title: 'Peer Recovery Specialist', salary: '$32,000–$42,000' },
    { title: 'Recovery Coach', salary: '$35,000–$45,000' },
    { title: 'Community Health Worker', salary: '$34,000–$44,000' },
    { title: 'Case Manager (with experience)', salary: '$38,000–$50,000' },
  ],
  steps: [
    { title: 'Apply Online', desc: 'Complete our application in about 5 minutes.' },
    { title: 'Check Funding', desc: 'Register at Indiana Career Connect for WIOA eligibility.' },
    { title: 'Interview', desc: 'Meet with program staff to discuss your recovery journey.' },
    { title: 'Start Training', desc: 'Begin your 6-week peer recovery specialist program.' },
  ],
  faqs: [
    { question: 'Do I need to be in recovery to enroll?', answer: 'Indiana requires CPRS candidates to have lived experience with recovery from substance use or mental health challenges. You must have at least 2 years of sustained recovery.' },
    { question: 'Is this program free?', answer: 'Yes, for eligible participants. WIOA funding covers tuition and materials. If you do not qualify for WIOA, payment plans are available.' },
  ],
  applyHref: '/apply?program=peer-recovery-specialist',
  breadcrumbs: [{ label: 'Programs', href: '/programs' }, { label: 'Healthcare', href: '/programs/healthcare' }, { label: 'Peer Recovery Specialist' }],
};

export default function Page() {
  return (<><ProgramStructuredData program={{ id: 'peer-recovery-specialist', name: config.title, slug: 'peer-recovery-specialist', description: config.subtitle, duration_weeks: 6, price: 0, image_url: `${SITE_URL}/images/programs-fresh/peer-recovery.jpg`, category: 'Healthcare', outcomes: config.credentials || [] }} /><ProgramPageLayout config={config} /></>);
}
