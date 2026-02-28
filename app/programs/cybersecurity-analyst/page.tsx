export const dynamic = 'force-static';
export const revalidate = 86400;
import { Metadata } from 'next';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';
import ProgramPageLayout from '@/components/programs/ProgramPageLayout';
import type { ProgramPageConfig } from '@/components/programs/ProgramPageLayout';
const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Cybersecurity Analyst | CompTIA Security+ | Indianapolis',
  description: 'Earn CompTIA Security+ and IT Specialist certifications. 12-week program. Cybersecurity analysts earn $112,000/year.',
  alternates: { canonical: `${SITE_URL}/programs/cybersecurity-analyst` },
};

const config: ProgramPageConfig = {
  videoSrc: '/videos/it-technology.mp4',
  voiceoverSrc: '/audio/heroes/technology.mp3',
  title: 'Cybersecurity Analyst',
  subtitle: 'Protect networks and data from cyber threats. Earn CompTIA Security+ in 12 weeks.',
  badge: '5-Star Top Job — DWD',
  badgeColor: 'purple',
  duration: '12 weeks',
  cost: '$5,400 (WorkOne funding available)',
  format: 'In-person, Indianapolis',
  credential: 'CompTIA Security+',
  overview: 'This 12-week program covers network security, threat analysis, vulnerability assessment, incident response, and compliance. You will work in a hands-on cyber lab with real security tools including Wireshark, Nmap, and SIEM platforms. Graduates earn the CompTIA Security+ certification — the baseline credential for cybersecurity professionals.',
  highlights: ['Threat identification and risk assessment', 'Network security and firewall configuration', 'Vulnerability scanning with Nmap and Nessus', 'Incident response and forensics basics', 'CompTIA Security+ certification exam included', 'Hands-on cyber lab with real security tools'],
  overviewImage: '/images/programs-fresh/cybersecurity.jpg',
  overviewImageAlt: 'Cybersecurity analyst monitoring network traffic',
  salaryNumber: 112000,
  salaryLabel: 'Average annual salary for cybersecurity analysts (BLS)',
  salaryPrefix: '$',
  curriculum: [
    { title: 'Security Fundamentals', topics: ['CIA triad', 'Authentication and authorization', 'Encryption basics', 'Security policies', 'Risk management frameworks'] },
    { title: 'Network Security', topics: ['Firewalls and IDS/IPS', 'VPN configuration', 'Network segmentation', 'Wireless security', 'Port security'] },
    { title: 'Threats & Vulnerabilities', topics: ['Malware types and behavior', 'Social engineering attacks', 'Vulnerability scanning', 'Penetration testing basics', 'OWASP Top 10'] },
    { title: 'Incident Response', topics: ['Incident response lifecycle', 'Digital forensics basics', 'Log analysis', 'Chain of custody', 'Disaster recovery planning'] },
    { title: 'Compliance & Governance', topics: ['NIST framework', 'PCI-DSS basics', 'HIPAA security', 'SOC 2 overview', 'Security auditing'] },
    { title: 'Certification Prep', topics: ['CompTIA Security+ objectives', 'Practice exams', 'On-site testing', 'Resume and interview prep', 'Career placement support'] },
  ],
  credentials: ['CompTIA Security+', 'IT Specialist — Cybersecurity (Certiport)', 'Certificate of Completion'],
  careers: [
    { title: 'Cybersecurity Analyst', salary: '$75,000–$120,000' },
    { title: 'Security Operations Center Analyst', salary: '$60,000–$90,000' },
    { title: 'Information Security Specialist', salary: '$70,000–$110,000' },
    { title: 'Penetration Tester', salary: '$85,000–$130,000' },
  ],
  steps: [
    { title: 'Apply Online', desc: 'Complete our application in about 5 minutes.' },
    { title: 'Check Funding', desc: 'Register at Indiana Career Connect for WIOA eligibility.' },
    { title: 'Attend Orientation', desc: 'Meet your instructor and tour the cyber lab.' },
    { title: 'Start Training', desc: 'Begin your 12-week cybersecurity program.' },
  ],
  faqs: [
    { question: 'Do I need IT experience?', answer: 'CompTIA A+ or Network+ is recommended but not required. If you have basic computer and networking knowledge, you can succeed in this program.' },
    { question: 'Is cybersecurity in demand?', answer: 'Yes. There are over 750,000 unfilled cybersecurity positions in the U.S. Demand is growing 33% faster than average. Indiana employers are actively hiring.' },
    { question: 'What is CompTIA Security+?', answer: 'CompTIA Security+ is the baseline cybersecurity certification recognized by the U.S. Department of Defense and employers worldwide. It validates your ability to assess and manage security risks.' },
  ],
  applyHref: '/apply?program=cybersecurity-analyst',
  breadcrumbs: [{ label: 'Programs', href: '/programs' }, { label: 'Technology', href: '/programs/technology' }, { label: 'Cybersecurity Analyst' }],
};

export default function Page() {
  return (<><ProgramStructuredData program={{ id: 'cybersecurity-analyst', name: config.title, slug: 'cybersecurity-analyst', description: config.subtitle, duration_weeks: 12, price: 5400, image_url: `${SITE_URL}/images/programs-fresh/cybersecurity.jpg`, category: 'Technology', outcomes: config.credentials || [] }} /><ProgramPageLayout config={config} /></>);
}
