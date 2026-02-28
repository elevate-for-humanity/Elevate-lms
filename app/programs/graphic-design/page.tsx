export const dynamic = 'force-static';
export const revalidate = 86400;
import { Metadata } from 'next';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';
import ProgramPageLayout from '@/components/programs/ProgramPageLayout';
import type { ProgramPageConfig } from '@/components/programs/ProgramPageLayout';
const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Graphic Design | Adobe Certified Professional | Indianapolis',
  description: 'Earn Adobe Certified Professional credentials. 10-week program. Graphic designers earn $58,910/year in Indiana.',
  alternates: { canonical: `${SITE_URL}/programs/graphic-design` },
  openGraph: {
    title: 'Graphic Design | Adobe Certified Professional | Indianapolis',
    description: 'Earn Adobe Certified Professional credentials. 10-week program. Graphic designers earn $58,910/year in Indiana.',
    url: `${SITE_URL}/programs/graphic-design`,
    siteName: 'Elevate for Humanity',
    images: [{ url: '/images/og-image.jpg', width: 1200, height: 630, alt: 'Graphic Design | Adobe Certified Professional | Indianapolis' }],
    type: 'website',
  },
};

const config: ProgramPageConfig = {
  videoSrc: '/videos/it-technology.mp4',
  voiceoverSrc: '/audio/heroes/technology.mp3',
  title: 'Graphic Design',
  subtitle: 'Create visual content for print and digital media. Earn Adobe Certified Professional credentials in 10 weeks.',
  badge: '4-Star Top Job — DWD',
  badgeColor: 'blue',
  duration: '10 weeks',
  cost: '$4,730 (WorkOne funding available)',
  format: 'In-person, Indianapolis',
  credential: 'Adobe Certified Professional',
  overview: 'This 10-week program teaches Adobe Photoshop, Illustrator, and InDesign. You will create logos, brochures, social media graphics, and brand identity packages. Graduates earn Adobe Certified Professional credentials and build a portfolio of real-world design projects.',
  highlights: ['Adobe Photoshop — photo editing and compositing', 'Adobe Illustrator — vector graphics and logo design', 'Adobe InDesign — layout and print design', 'Brand identity and typography fundamentals', 'Adobe Certified Professional exam included', 'Portfolio of 8+ completed design projects'],
  overviewImage: '/images/programs-fresh/graphic-design.jpg',
  overviewImageAlt: 'Graphic designer working on a brand identity project',
  salaryNumber: 58910,
  salaryLabel: 'Average annual salary for graphic designers in Indiana (BLS)',
  salaryPrefix: '$',
  curriculum: [
    { title: 'Photoshop', topics: ['Photo retouching and compositing', 'Layer masks and blending modes', 'Color correction', 'Web graphics and export', 'Smart objects and filters'] },
    { title: 'Illustrator', topics: ['Vector drawing tools', 'Logo design process', 'Typography and type tools', 'Pattern and icon design', 'Print-ready file preparation'] },
    { title: 'InDesign', topics: ['Page layout and grids', 'Multi-page documents', 'Master pages and styles', 'Print production', 'Interactive PDF creation'] },
    { title: 'Design Principles', topics: ['Color theory', 'Typography hierarchy', 'Composition and balance', 'Brand identity systems', 'Design for accessibility'] },
    { title: 'Portfolio & Career', topics: ['Portfolio website creation', 'Client project simulation', 'Freelance business basics', 'Interview preparation', 'Adobe Certified Professional exam'] },
  ],
  credentials: ['Adobe Certified Professional — Photoshop', 'Adobe Certified Professional — Illustrator', 'Certificate of Completion'],
  careers: [
    { title: 'Graphic Designer', salary: '$45,000–$70,000' },
    { title: 'Brand Designer', salary: '$50,000–$75,000' },
    { title: 'Marketing Designer', salary: '$48,000–$68,000' },
    { title: 'Freelance Designer', salary: '$40,000–$90,000+' },
  ],
  steps: [
    { title: 'Apply Online', desc: 'Complete our application in about 5 minutes.' },
    { title: 'Check Funding', desc: 'Register at Indiana Career Connect for WIOA eligibility.' },
    { title: 'Attend Orientation', desc: 'Meet your instructor and tour the design lab.' },
    { title: 'Start Designing', desc: 'Begin your 10-week graphic design program.' },
  ],
  faqs: [
    { question: 'Do I need design experience?', answer: 'No. This program starts from the basics. If you have an interest in visual creativity, that is enough to get started.' },
    { question: 'Do I need my own computer?', answer: 'No. All training is done on our computers with Adobe Creative Cloud installed. Adobe offers discounted student licenses if you want to practice at home.' },
    { question: 'Can I freelance after this program?', answer: 'Yes. Many graduates start freelancing immediately. The portfolio you build during the program serves as your calling card for clients.' },
  ],
  applyHref: '/apply?program=graphic-design',
  breadcrumbs: [{ label: 'Programs', href: '/programs' }, { label: 'Technology', href: '/programs/technology' }, { label: 'Graphic Design' }],
};

export default function Page() {
  return (<><ProgramStructuredData program={{ id: 'graphic-design', name: config.title, slug: 'graphic-design', description: config.subtitle, duration_weeks: 10, price: 4730, image_url: `${SITE_URL}/images/programs-fresh/graphic-design.jpg`, category: 'Technology', outcomes: config.credentials || [] }} /><ProgramPageLayout config={config} /></>);
}
