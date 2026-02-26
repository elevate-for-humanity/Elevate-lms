export const dynamic = 'force-static';
export const revalidate = 86400;
import { Metadata } from 'next';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';
import ProgramPageLayout from '@/components/programs/ProgramPageLayout';
import type { ProgramPageConfig } from '@/components/programs/ProgramPageLayout';
const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'IT Help Desk Technician | CompTIA A+ | Indianapolis',
  description: 'Earn CompTIA A+ and IT Specialist certifications. 8-week program. Help desk technicians earn $55,510/year in Indiana.',
  alternates: { canonical: `${SITE_URL}/programs/it-help-desk` },
};

const config: ProgramPageConfig = {
  videoSrc: '/videos/it-technology.mp4',
  title: 'IT Help Desk Technician',
  subtitle: 'Troubleshoot hardware, software, and networks. Earn CompTIA A+ in 8 weeks and start your IT career.',
  badge: '4-Star Top Job — DWD',
  badgeColor: 'blue',
  duration: '8 weeks',
  cost: '$4,550 (WorkOne funding available)',
  format: 'In-person, Indianapolis',
  credential: 'CompTIA A+',
  overview: 'This 8-week program teaches hardware repair, operating system troubleshooting, networking basics, and customer service skills. You will work with real computers, printers, and networking equipment in a hands-on lab. Graduates earn the CompTIA A+ certification — the industry standard for IT support professionals.',
  highlights: ['PC hardware assembly and repair', 'Windows and macOS troubleshooting', 'Networking fundamentals (TCP/IP, DNS, DHCP)', 'Help desk ticketing and customer service', 'CompTIA A+ certification exam included', 'Hands-on lab with real equipment'],
  overviewImage: '/images/programs-fresh/it-support.jpg',
  overviewImageAlt: 'IT technician troubleshooting a computer',
  salaryNumber: 55510,
  salaryLabel: 'Average annual salary for IT support in Indiana (BLS)',
  salaryPrefix: '$',
  curriculum: [
    { title: 'Hardware', topics: ['PC components and assembly', 'Motherboards, CPUs, RAM', 'Storage devices (SSD, HDD)', 'Printers and peripherals', 'Mobile device repair'] },
    { title: 'Operating Systems', topics: ['Windows 10/11 installation', 'macOS basics', 'Linux fundamentals', 'Command line tools', 'User account management'] },
    { title: 'Networking', topics: ['TCP/IP fundamentals', 'Wi-Fi setup and security', 'DNS and DHCP', 'VPN and remote access', 'Network troubleshooting'] },
    { title: 'Security', topics: ['Malware identification and removal', 'Antivirus and firewall setup', 'Data backup and recovery', 'Physical security', 'Social engineering awareness'] },
    { title: 'Help Desk Skills', topics: ['Ticketing systems', 'Remote support tools', 'Customer communication', 'Escalation procedures', 'Documentation best practices'] },
    { title: 'Certification Prep', topics: ['CompTIA A+ Core 1 objectives', 'CompTIA A+ Core 2 objectives', 'Practice exams', 'On-site testing', 'Career placement support'] },
  ],
  credentials: ['CompTIA A+ (Core 1 & Core 2)', 'IT Specialist — Device Configuration (Certiport)', 'Certificate of Completion'],
  careers: [
    { title: 'Help Desk Technician', salary: '$40,000–$55,000' },
    { title: 'Desktop Support Specialist', salary: '$45,000–$60,000' },
    { title: 'IT Support Specialist', salary: '$45,000–$65,000' },
    { title: 'Field Service Technician', salary: '$42,000–$58,000' },
  ],
  steps: [
    { title: 'Apply Online', desc: 'Complete our application in about 5 minutes.' },
    { title: 'Check Funding', desc: 'Register at Indiana Career Connect for WIOA eligibility.' },
    { title: 'Attend Orientation', desc: 'Meet your instructor and tour the IT lab.' },
    { title: 'Start Training', desc: 'Begin your 8-week IT help desk program.' },
  ],
  faqs: [
    { question: 'Do I need IT experience?', answer: 'No. This program is designed for beginners. If you can use a computer and browse the internet, you have enough experience to start.' },
    { question: 'What is CompTIA A+?', answer: 'CompTIA A+ is the industry-standard certification for IT support professionals. It is recognized by employers worldwide and is often required for entry-level IT positions.' },
    { question: 'How soon can I get a job?', answer: 'Most graduates find employment within 2-4 weeks of earning their CompTIA A+ certification. Our career services team connects you with hiring employers.' },
  ],
  applyHref: '/apply?program=it-help-desk',
  breadcrumbs: [{ label: 'Programs', href: '/programs' }, { label: 'Technology', href: '/programs/technology' }, { label: 'IT Help Desk' }],
};

export default function Page() {
  return (<><ProgramStructuredData program={{ id: 'it-help-desk', name: config.title, slug: 'it-help-desk', description: config.subtitle, duration_weeks: 8, price: 4550, image_url: `${SITE_URL}/images/programs-fresh/it-support.jpg`, category: 'Technology', outcomes: config.credentials || [] }} /><ProgramPageLayout config={config} /></>);
}
