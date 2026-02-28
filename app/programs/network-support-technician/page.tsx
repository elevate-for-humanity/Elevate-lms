export const dynamic = 'force-static';
export const revalidate = 86400;
import { Metadata } from 'next';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';
import ProgramPageLayout from '@/components/programs/ProgramPageLayout';
import type { ProgramPageConfig } from '@/components/programs/ProgramPageLayout';
const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Network Support Technician | IT Specialist Certified | Indianapolis',
  description: 'Earn IT Specialist — Networking certification. 8-week program. Network support technicians earn $55,000/year in Indiana.',
  alternates: { canonical: `${SITE_URL}/programs/network-support-technician` },
  openGraph: {
    title: 'Network Support Technician | IT Specialist Certified | Indianapolis',
    description: 'Earn IT Specialist — Networking certification. 8-week program. Network support technicians earn $55,000/year in Indiana.',
    url: `${SITE_URL}/programs/network-support-technician`,
    siteName: 'Elevate for Humanity',
    images: [{ url: '/images/og-image.jpg', width: 1200, height: 630, alt: 'Network Support Technician | IT Specialist Certified | Indianapolis' }],
    type: 'website',
  },
};

const config: ProgramPageConfig = {
  videoSrc: '/videos/it-technology.mp4',
  voiceoverSrc: '/audio/heroes/technology.mp3',
  title: 'Network Support Technician',
  subtitle: 'Install, configure, and troubleshoot network infrastructure. Earn the IT Specialist — Networking certification in 8 weeks.',
  badge: 'Funding Available', badgeColor: 'blue',
  duration: '8 weeks', cost: '$4,550 (WorkOne funding available)', format: 'In-person, Indianapolis', credential: 'IT Specialist — Networking',
  overview: 'This 8-week program covers network installation, configuration, and troubleshooting. You will work with routers, switches, and cabling in a hands-on lab. Graduates earn the Certiport IT Specialist — Networking certification and are prepared for entry-level network support positions.',
  highlights: ['Network cabling and termination', 'Router and switch configuration', 'TCP/IP, DNS, DHCP fundamentals', 'Wireless network setup', 'Certiport IT Specialist certification exam included', 'Hands-on lab with enterprise equipment'],
  overviewImage: '/images/programs-fresh/network-admin.jpg', overviewImageAlt: 'Technician working on network cabling',
  salaryNumber: 55000, salaryLabel: 'Average annual salary for network support in Indiana', salaryPrefix: '$',
  curriculum: [
    { title: 'Network Basics', topics: ['OSI model', 'TCP/IP protocol suite', 'IP addressing', 'Subnetting', 'Network topologies'] },
    { title: 'Infrastructure', topics: ['Ethernet cabling', 'Cable termination and testing', 'Patch panels and racks', 'Fiber optic basics', 'Structured cabling standards'] },
    { title: 'Configuration', topics: ['Router setup', 'Switch VLANs', 'DHCP and DNS configuration', 'Wireless access points', 'Basic firewall rules'] },
    { title: 'Troubleshooting', topics: ['Ping and traceroute', 'Cable testers', 'Network monitoring', 'Common connectivity issues', 'Documentation'] },
    { title: 'Certification Prep', topics: ['IT Specialist exam objectives', 'Practice exams', 'On-site Certiport testing', 'Resume prep', 'Career placement support'] },
  ],
  credentials: ['IT Specialist — Networking (Certiport)', 'Certificate of Completion'],
  careers: [
    { title: 'Network Support Technician', salary: '$40,000–$58,000' },
    { title: 'Cable Technician', salary: '$35,000–$50,000' },
    { title: 'IT Support Specialist', salary: '$42,000–$60,000' },
  ],
  steps: [
    { title: 'Apply Online', desc: 'Complete our application in about 5 minutes.' },
    { title: 'Check Funding', desc: 'Register at Indiana Career Connect for WIOA eligibility.' },
    { title: 'Attend Orientation', desc: 'Meet your instructor and tour the networking lab.' },
    { title: 'Start Training', desc: 'Begin your 8-week network support program.' },
  ],
  applyHref: '/apply?program=network-support-technician',
  breadcrumbs: [{ label: 'Programs', href: '/programs' }, { label: 'Technology', href: '/programs/technology' }, { label: 'Network Support Technician' }],
};

export default function Page() {
  return (<><ProgramStructuredData program={{ id: 'network-support-technician', name: config.title, slug: 'network-support-technician', description: config.subtitle, duration_weeks: 8, price: 4550, image_url: `${SITE_URL}/images/programs-fresh/network-admin.jpg`, category: 'Technology', outcomes: config.credentials || [] }} /><ProgramPageLayout config={config} /></>);
}
