export const dynamic = 'force-static';
export const revalidate = 86400;
import { Metadata } from 'next';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';
import ProgramPageLayout from '@/components/programs/ProgramPageLayout';
import type { ProgramPageConfig } from '@/components/programs/ProgramPageLayout';
const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Barber Apprenticeship | 2,000-Hour Licensed Training | Indianapolis',
  description: 'Barber apprenticeship in Indianapolis. 2,000 OJT hours in licensed barbershops. Earn while you learn. Licensure pathway included.',
  alternates: { canonical: `${SITE_URL}/programs/barber-apprenticeship` },
};

const config: ProgramPageConfig = {
  videoSrc: '/videos/barber-hero-final.mp4', voiceoverSrc: '/audio/heroes/barber.mp3',
  title: 'Barber Apprenticeship', subtitle: 'Earn while you learn. Complete 2,000 hours of on-the-job training in licensed barbershops and earn your Indiana Barber License.',
  badge: 'Earn While You Learn', badgeColor: 'red',
  duration: '12–18 months', cost: '$4,890 (payment plans available)', format: 'In-shop OJT + classroom, Indianapolis', credential: 'Indiana Barber License',
  overview: 'This DOL-registered apprenticeship combines 2,000 hours of on-the-job training in licensed barbershops with structured classroom instruction. You will learn haircutting, fading, beard grooming, razor work, sanitation, and business skills. The program aligns with Indiana Professional Licensing Agency requirements for the Registered Barber License exam.',
  highlights: ['2,000 hours of paid on-the-job training', 'Training in licensed barbershops with real clients', 'Haircutting, fading, beard grooming, razor work', 'Sanitation and infection control certification', 'Indiana Barber License exam preparation', 'Business skills for independent barbering'],
  overviewImage: '/images/programs-fresh/barber.jpg', overviewImageAlt: 'Barber apprentice cutting hair in a barbershop',
  salaryNumber: 45000, salaryLabel: 'Average annual salary for barbers in Indiana (BLS)', salaryPrefix: '$',
  curriculum: [
    { title: 'Haircutting', topics: ['Clipper techniques and fading', 'Scissor cutting and texturizing', 'Taper and blend techniques', 'Line-ups and edge work', 'Style consultation'] },
    { title: 'Shaving & Grooming', topics: ['Straight razor shaving', 'Beard trimming and shaping', 'Hot towel service', 'Facial hair design', 'Skin care basics'] },
    { title: 'Sanitation', topics: ['Indiana sanitation requirements', 'Disinfection procedures', 'Bloodborne pathogen safety', 'Tool sterilization', 'Shop cleanliness standards'] },
    { title: 'Business Skills', topics: ['Client retention strategies', 'Pricing and booking', 'Social media marketing', 'Chair rental vs booth rent', 'Building a clientele'] },
    { title: 'Licensure Prep', topics: ['Indiana barber law and regulations', 'Written exam preparation', 'Practical exam preparation', 'License application process', 'Continuing education requirements'] },
  ],
  credentials: ['Indiana Registered Barber License (exam prep)', 'Rise Up Certificate', 'Sanitation/Infection Control Certificate'],
  careers: [
    { title: 'Licensed Barber', salary: '$30,000–$60,000' },
    { title: 'Barbershop Owner', salary: '$50,000–$100,000+' },
    { title: 'Master Barber', salary: '$45,000–$80,000' },
  ],
  steps: [
    { title: 'Apply Online', desc: 'Complete our application in about 5 minutes.' },
    { title: 'Interview', desc: 'Meet with program staff and tour partner barbershops.' },
    { title: 'Enroll', desc: 'Payment plans available — weekly or monthly options.' },
    { title: 'Start Cutting', desc: 'Begin your apprenticeship in a licensed barbershop.' },
  ],
  faqs: [
    { question: 'Do I get paid during the apprenticeship?', answer: 'This is an earn-while-you-learn model. Compensation varies by barbershop partner. Some shops pay a stipend, others offer commission on services. Details are discussed during your interview.' },
    { question: 'How is this different from barber school?', answer: 'Traditional barber school is classroom-based. This apprenticeship puts you in a real barbershop from day one, cutting real clients under supervision. You learn by doing, not just watching.' },
    { question: 'Is this program eligible for WIOA or JRI funding?', answer: 'Some participants may qualify for JRI (Justice Reinvestment Initiative) funding. WIOA eligibility depends on your individual circumstances. Contact us to check your options.' },
    { question: 'What if I have a criminal record?', answer: 'We specialize in serving justice-involved individuals. Having a record does not automatically disqualify you. Indiana reviews barber license applications individually.' },
  ],
  applyHref: '/programs/barber-apprenticeship/apply',
  breadcrumbs: [{ label: 'Programs', href: '/programs' }, { label: 'Apprenticeships', href: '/programs/apprenticeships' }, { label: 'Barber Apprenticeship' }],
};

import SponsorDisclosure from '@/components/compliance/SponsorDisclosure';

export default function Page() {
  return (<><ProgramStructuredData program={{ id: 'barber-apprenticeship', name: config.title, slug: 'barber-apprenticeship', description: config.subtitle, duration_weeks: 65, price: 4890, image_url: `${SITE_URL}/images/programs-fresh/barber.jpg`, category: 'Beauty & Cosmetology', outcomes: config.credentials || [] }} /><ProgramPageLayout config={config}><SponsorDisclosure /></ProgramPageLayout></>);
}
