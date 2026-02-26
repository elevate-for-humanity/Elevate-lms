export const dynamic = 'force-static';
export const revalidate = 86400;
import { Metadata } from 'next';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';
import ProgramPageLayout from '@/components/programs/ProgramPageLayout';
import type { ProgramPageConfig } from '@/components/programs/ProgramPageLayout';
const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Medical Assistant Program | CCMA Certified | Indianapolis',
  description: 'Become a Certified Clinical Medical Assistant in 12-16 weeks. Free with WIOA funding. Clinical rotations and job placement included.',
  alternates: { canonical: `${SITE_URL}/programs/medical-assistant` },
};

const config: ProgramPageConfig = {
  videoSrc: '/videos/healthcare-cna.mp4', voiceoverSrc: '/audio/heroes/medical-assistant.mp3',
  title: 'Medical Assistant', subtitle: 'Perform clinical and administrative duties in medical offices. Earn CCMA certification in 12–16 weeks.',
  badge: 'Free with WIOA', badgeColor: 'green',
  duration: '12–16 weeks', cost: '$0 with WIOA funding', format: 'In-person, Indianapolis', credential: 'CCMA (NHA)',
  overview: 'This program trains you in both clinical and administrative medical assisting. Clinical skills include vital signs, injections, EKG, phlebotomy, and specimen collection. Administrative skills include medical billing, coding, scheduling, and electronic health records. Graduates earn the Certified Clinical Medical Assistant (CCMA) credential through the National Healthcareer Association.',
  highlights: ['Clinical skills: vitals, injections, EKG, phlebotomy', 'Administrative skills: billing, coding, scheduling', 'Electronic Health Records (EHR) training', 'CCMA certification exam included', 'Supervised clinical externship', 'Job placement with 50+ healthcare employers'],
  overviewImage: '/images/programs-fresh/medical-assistant.jpg', overviewImageAlt: 'Medical assistant taking patient vitals',
  salaryNumber: 42000, salaryLabel: 'Average annual salary for medical assistants in Indiana (BLS)', salaryPrefix: '$',
  curriculum: [
    { title: 'Clinical Procedures', topics: ['Vital signs measurement', 'Injection techniques', 'Wound care and dressing', 'Specimen collection', 'Sterilization and infection control'] },
    { title: 'Diagnostic Testing', topics: ['EKG/ECG administration', 'Phlebotomy techniques', 'Urinalysis', 'Point-of-care testing', 'Lab safety protocols'] },
    { title: 'Pharmacology', topics: ['Drug classifications', 'Medication administration routes', 'Dosage calculations', 'Prescription handling', 'Controlled substance regulations'] },
    { title: 'Administrative Skills', topics: ['Medical billing and coding (ICD-10, CPT)', 'Insurance verification', 'Appointment scheduling', 'Electronic Health Records', 'HIPAA compliance'] },
    { title: 'Patient Communication', topics: ['Patient intake procedures', 'Medical terminology', 'Cultural competency', 'Telephone triage basics', 'Documentation standards'] },
    { title: 'Externship & Certification', topics: ['Clinical externship hours', 'CCMA exam preparation', 'NHA certification testing', 'Resume and interview prep', 'Career placement support'] },
  ],
  credentials: ['Certified Clinical Medical Assistant (CCMA)', 'CPR/BLS Certification', 'Certificate of Completion'],
  careers: [
    { title: 'Medical Assistant', salary: '$36,000–$46,000' },
    { title: 'Clinical Medical Assistant', salary: '$38,000–$48,000' },
    { title: 'Medical Office Administrator', salary: '$35,000–$45,000' },
    { title: 'Patient Care Coordinator', salary: '$38,000–$50,000' },
  ],
  steps: [
    { title: 'Apply Online', desc: 'Complete our application in about 5 minutes.' },
    { title: 'Check Funding', desc: 'Most students qualify for free training through WIOA.' },
    { title: 'Background Check', desc: 'Healthcare programs require a background check and drug screen.' },
    { title: 'Start Training', desc: 'Begin classroom instruction and clinical externship.' },
  ],
  faqs: [
    { question: 'What is the difference between CNA and Medical Assistant?', answer: 'CNAs focus on patient care in nursing homes and hospitals (bathing, feeding, mobility). Medical Assistants work in doctor offices and clinics doing both clinical tasks (vitals, injections, EKG) and administrative tasks (billing, scheduling). MA programs are longer but offer higher pay and more variety.' },
    { question: 'Do I need prior healthcare experience?', answer: 'No. This program is designed for beginners. You need a high school diploma or GED, and you must pass a background check and drug screen.' },
    { question: 'What is the CCMA certification?', answer: 'CCMA stands for Certified Clinical Medical Assistant. It is issued by the National Healthcareer Association (NHA) and is one of the most recognized medical assistant certifications in the country.' },
  ],
  applyHref: '/apply?program=medical-assistant',
  breadcrumbs: [{ label: 'Programs', href: '/programs' }, { label: 'Healthcare', href: '/programs/healthcare' }, { label: 'Medical Assistant' }],
};

export default function Page() {
  return (<><ProgramStructuredData program={{ id: 'medical-assistant', name: config.title, slug: 'medical-assistant', description: config.subtitle, duration_weeks: 16, price: 0, image_url: `${SITE_URL}/images/programs-fresh/medical-assistant.jpg`, category: 'Healthcare', outcomes: config.credentials || [] }} /><ProgramPageLayout config={config} /></>);
}
