export const dynamic = 'force-static';
export const revalidate = 86400;

import { Metadata } from 'next';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';
import ProgramPageLayout from '@/components/programs/ProgramPageLayout';
import type { ProgramPageConfig } from '@/components/programs/ProgramPageLayout';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'CAD/Drafting Technician | Autodesk Certified | Indianapolis',
  description: 'Earn the Autodesk Certified User certification. 10-week program. WorkOne-eligible 4-star Top Job. Drafters earn $63,419/year in Indiana.',
  keywords: 'CAD training, Autodesk certification, AutoCAD training Indianapolis, drafting technician program, architectural drafting, WorkOne funded CAD',
  alternates: { canonical: `${SITE_URL}/programs/cad-drafting` },
  openGraph: {
    title: 'CAD/Drafting Technician | Autodesk Certified | Indianapolis',
    description: 'Earn the Autodesk Certified User certification. 10-week program. WorkOne-eligible 4-star Top Job. Drafters earn $63,419/year in Indiana.',
    url: `${SITE_URL}/programs/cad-drafting`,
    siteName: 'Elevate for Humanity',
    images: [{ url: '/images/og-image.jpg', width: 1200, height: 630, alt: 'CAD/Drafting Technician | Autodesk Certified | Indianapolis' }],
    type: 'website',
  },
};

const config: ProgramPageConfig = {
  videoSrc: '/videos/it-technology.mp4',
  voiceoverSrc: '/audio/heroes/technology.mp3',

  title: 'CAD/Drafting Technician',
  subtitle: 'Design buildings and infrastructure with AutoCAD. Earn the Autodesk Certified User credential in 10 weeks.',
  badge: '4-Star Top Job — DWD',
  badgeColor: 'blue',

  duration: '10 weeks',
  cost: '$4,890 (WorkOne funding available)',
  format: 'In-person, Indianapolis',
  credential: 'Autodesk Certified User',

  overview: 'This 10-week program teaches you AutoCAD 2D and 3D drafting, blueprint reading, and Revit fundamentals. You will create construction documents, floor plans, and site plans used by architects, engineers, and contractors. Graduates are prepared for the Autodesk Certified User exam administered on-site through our Certiport testing center.',
  highlights: [
    'AutoCAD 2D drafting — lines, layers, dimensions, plotting',
    'AutoCAD 3D modeling — solids, surfaces, rendering',
    'Blueprint reading and construction document interpretation',
    'Revit fundamentals for Building Information Modeling (BIM)',
    'Autodesk Certified User exam prep and on-site testing',
    'Portfolio of 5+ completed drafting projects',
  ],
  overviewImage: '/images/programs-fresh/cad-drafting.jpg',
  overviewImageAlt: 'Student working on AutoCAD drafting project',

  salaryNumber: 63419,
  salaryLabel: 'Average annual salary for drafters in Indiana (BLS)',
  salaryPrefix: '$',

  curriculum: [
    {
      title: 'AutoCAD 2D Fundamentals',
      topics: ['Drawing setup and units', 'Lines, arcs, circles, polylines', 'Layers, colors, linetypes', 'Dimensioning and annotation', 'Plotting and page setup'],
    },
    {
      title: 'AutoCAD 3D & Rendering',
      topics: ['3D coordinate systems', 'Solid modeling', 'Surface modeling', 'Materials and lighting', 'Rendering and visualization'],
    },
    {
      title: 'Blueprint Reading',
      topics: ['Architectural plans', 'Structural drawings', 'Mechanical drawings', 'Electrical schematics', 'Construction specifications'],
    },
    {
      title: 'Revit & BIM',
      topics: ['Revit interface and navigation', 'Walls, doors, windows', 'Floor plans and elevations', 'Schedules and tags', 'BIM collaboration workflows'],
    },
    {
      title: 'Professional Practice',
      topics: ['Industry standards (ANSI, ISO)', 'File management and naming', 'Client communication', 'Portfolio development', 'Interview preparation'],
    },
    {
      title: 'Certification Prep',
      topics: ['Autodesk Certified User objectives', 'Practice exams', 'On-site Certiport testing', 'Certificate of Completion', 'Career placement support'],
    },
  ],

  credentials: [
    'Autodesk Certified User — AutoCAD',
    'Certificate of Completion',
  ],

  careers: [
    { title: 'Architectural Drafter', salary: '$55,000–$72,000', growth: 'SOC 17-3011' },
    { title: 'Civil Drafter', salary: '$50,000–$68,000' },
    { title: 'CAD Technician', salary: '$48,000–$65,000' },
    { title: 'Mechanical Drafter', salary: '$52,000–$70,000' },
    { title: 'BIM Technician', salary: '$55,000–$75,000' },
    { title: 'Design Coordinator', salary: '$50,000–$68,000' },
  ],

  steps: [
    { title: 'Apply Online', desc: 'Complete our application in about 5 minutes. No account needed.' },
    { title: 'Check Funding', desc: 'Register at Indiana Career Connect to verify WIOA eligibility.' },
    { title: 'Attend Orientation', desc: 'Meet your instructor and tour the training facility.' },
    { title: 'Start Training', desc: 'Begin your 10-week program and start building your portfolio.' },
  ],

  faqs: [
    { question: 'Do I need prior CAD experience?', answer: 'No. This program starts from the basics. You will learn everything from scratch — how to navigate AutoCAD, create drawings, and build 3D models. All you need is a high school diploma or GED.' },
    { question: 'Is this program eligible for WIOA funding?', answer: 'Yes. CAD/Drafting is a DWD 4-Star Top Job occupation, which means it qualifies for WIOA and WorkOne funding. If you are eligible, your tuition, books, and supplies are covered at no cost to you.' },
    { question: 'What computer do I need?', answer: 'All training is done on our computers at the Indianapolis training center. You do not need your own computer or software. Autodesk provides free student licenses if you want to practice at home.' },
    { question: 'Where do graduates work?', answer: 'Graduates work at architecture firms, engineering companies, construction companies, and government agencies. Common job titles include Architectural Drafter, CAD Technician, Civil Drafter, and BIM Technician.' },
    { question: 'When is the certification exam?', answer: 'The Autodesk Certified User exam is administered on-site during the final week of the program through our Certiport testing center. The exam fee is included in your tuition.' },
  ],

  applyHref: '/apply?program=cad-drafting',

  breadcrumbs: [
    { label: 'Programs', href: '/programs' },
    { label: 'Technology', href: '/programs/technology' },
    { label: 'CAD/Drafting Technician' },
  ],
};

export default function Page() {
  return (
    <>
      <ProgramStructuredData program={{
        id: 'cad-drafting',
        name: 'CAD/Drafting Technician — Autodesk Certified',
        slug: 'cad-drafting',
        description: config.subtitle,
        duration_weeks: 10,
        price: 4890,
        image_url: `${SITE_URL}/images/programs-fresh/cad-drafting.jpg`,
        category: 'Technology',
        outcomes: ['Autodesk Certified User — AutoCAD (Certiport/Autodesk)', 'Certificate of Completion'],
      }} />
      <ProgramPageLayout config={config} />
    </>
  );
}
