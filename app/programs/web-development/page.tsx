export const dynamic = 'force-static';
export const revalidate = 86400;
import { Metadata } from 'next';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';
import ProgramPageLayout from '@/components/programs/ProgramPageLayout';
import type { ProgramPageConfig } from '@/components/programs/ProgramPageLayout';
const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Web Development | Meta & WordPress Certified | Indianapolis',
  description: 'Earn Meta Digital Marketing Associate and WordPress certifications. 10-week program. WorkOne-eligible. Web developers earn $80,267/year.',
  alternates: { canonical: `${SITE_URL}/programs/web-development` },
};

const config: ProgramPageConfig = {
  videoSrc: '/videos/it-technology.mp4',
  voiceoverSrc: '/audio/heroes/technology.mp3',
  title: 'Web Development',
  subtitle: 'Build websites and digital experiences. Earn Meta and WordPress certifications in 10 weeks.',
  badge: '4-Star Top Job — DWD',
  badgeColor: 'blue',
  duration: '10 weeks',
  cost: '$4,730 (WorkOne funding available)',
  format: 'In-person, Indianapolis',
  credential: 'Meta + WordPress Certified',
  overview: 'This 10-week program teaches HTML, CSS, JavaScript, and WordPress development. You will build responsive websites, manage content management systems, and learn digital marketing fundamentals. Graduates earn the Meta Digital Marketing Associate and WordPress certifications through our Certiport testing center.',
  highlights: [
    'HTML5, CSS3, and JavaScript fundamentals',
    'WordPress theme development and customization',
    'Responsive design and mobile-first development',
    'Meta Digital Marketing Associate certification',
    'WordPress Certified credential',
    'Portfolio of 5+ completed web projects',
  ],
  overviewImage: '/images/programs-fresh/web-dev.jpg',
  overviewImageAlt: 'Student coding a website on dual monitors',
  salaryNumber: 80267,
  salaryLabel: 'Average annual salary for web developers in Indiana (BLS)',
  salaryPrefix: '$',
  curriculum: [
    { title: 'HTML & CSS', topics: ['Semantic HTML5', 'CSS Grid and Flexbox', 'Responsive design', 'Accessibility basics', 'CSS animations'] },
    { title: 'JavaScript', topics: ['Variables and data types', 'Functions and scope', 'DOM manipulation', 'Event handling', 'API integration'] },
    { title: 'WordPress', topics: ['Installation and setup', 'Theme customization', 'Plugins and widgets', 'Custom post types', 'WooCommerce basics'] },
    { title: 'Digital Marketing', topics: ['SEO fundamentals', 'Google Analytics', 'Social media integration', 'Content strategy', 'Meta advertising basics'] },
    { title: 'Portfolio & Deployment', topics: ['Git version control', 'Domain and hosting setup', 'Portfolio website build', 'Client project simulation', 'Performance optimization'] },
    { title: 'Certification Prep', topics: ['Meta exam objectives', 'WordPress exam objectives', 'Practice exams', 'On-site Certiport testing', 'Career placement support'] },
  ],
  credentials: ['Meta Digital Marketing Associate', 'WordPress Certified', 'Certificate of Completion'],
  careers: [
    { title: 'Web Developer', salary: '$65,000–$95,000', growth: 'SOC 15-1254' },
    { title: 'Front-End Developer', salary: '$60,000–$90,000' },
    { title: 'WordPress Developer', salary: '$55,000–$80,000' },
    { title: 'Digital Marketing Specialist', salary: '$45,000–$65,000' },
    { title: 'Freelance Web Developer', salary: '$50,000–$100,000+' },
  ],
  steps: [
    { title: 'Apply Online', desc: 'Complete our application in about 5 minutes.' },
    { title: 'Check Funding', desc: 'Register at Indiana Career Connect for WIOA eligibility.' },
    { title: 'Attend Orientation', desc: 'Meet your instructor and tour the lab.' },
    { title: 'Start Building', desc: 'Begin your 10-week web development program.' },
  ],
  faqs: [
    { question: 'Do I need coding experience?', answer: 'No. This program starts from scratch. You will learn HTML, CSS, and JavaScript from the ground up. All you need is basic computer skills.' },
    { question: 'What computer do I need?', answer: 'All training is done on our computers at the Indianapolis training center. You do not need your own computer. Free software tools are available if you want to practice at home.' },
    { question: 'Is this program eligible for WIOA funding?', answer: 'Yes. Web Development is a DWD 4-Star Top Job, which qualifies for WIOA and WorkOne funding. If eligible, your tuition is covered at no cost.' },
    { question: 'Can I freelance after this program?', answer: 'Yes. Many graduates start freelancing while also working full-time. The WordPress and digital marketing skills are especially valuable for freelance work.' },
  ],
  applyHref: '/apply?program=web-development',
  breadcrumbs: [{ label: 'Programs', href: '/programs' }, { label: 'Technology', href: '/programs/technology' }, { label: 'Web Development' }],
};

export default function Page() {
  return (
    <>
      <ProgramStructuredData program={{ id: 'web-development', name: 'Web Development — Meta & WordPress Certified', slug: 'web-development', description: config.subtitle, duration_weeks: 10, price: 4730, image_url: `${SITE_URL}/images/programs-fresh/web-dev.jpg`, category: 'Technology', outcomes: config.credentials || [] }} />
      <ProgramPageLayout config={config} />
    </>
  );
}
