export const dynamic = 'force-static';
export const revalidate = 86400;
import { Metadata } from 'next';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';
import ProgramPageLayout from '@/components/programs/ProgramPageLayout';
import type { ProgramPageConfig } from '@/components/programs/ProgramPageLayout';
const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Network Administration | CompTIA Network+ | Indianapolis',
  description: 'Earn CompTIA Network+ and IT Specialist certifications. 10-week program. Network admins earn $80,600/year in Indiana.',
  alternates: { canonical: `${SITE_URL}/programs/network-administration` },
};

const config: ProgramPageConfig = {
  videoSrc: '/videos/it-technology.mp4',
  voiceoverSrc: '/audio/heroes/technology.mp3',
  title: 'Network Administration',
  subtitle: 'Configure, manage, and troubleshoot enterprise networks. Earn CompTIA Network+ in 10 weeks.',
  badge: '4-Star Top Job — DWD',
  badgeColor: 'blue',
  duration: '10 weeks',
  cost: '$4,890 (WorkOne funding available)',
  format: 'In-person, Indianapolis',
  credential: 'CompTIA Network+',
  overview: 'This 10-week program covers network infrastructure, routing and switching, wireless networking, network security, and troubleshooting. You will work with real Cisco and enterprise networking equipment in a hands-on lab. Graduates earn the CompTIA Network+ certification and are prepared for network administrator and support roles.',
  highlights: ['TCP/IP, DNS, DHCP, and subnetting', 'Router and switch configuration', 'Wireless network setup and security', 'Network troubleshooting methodology', 'CompTIA Network+ certification exam included', 'Hands-on lab with enterprise equipment'],
  overviewImage: '/images/programs-fresh/network-admin.jpg',
  overviewImageAlt: 'Network administrator configuring server rack',
  salaryNumber: 80600,
  salaryLabel: 'Average annual salary for network admins in Indiana (BLS)',
  salaryPrefix: '$',
  curriculum: [
    { title: 'Network Fundamentals', topics: ['OSI and TCP/IP models', 'IP addressing and subnetting', 'DNS, DHCP, NAT', 'Network topologies', 'Cabling and connectors'] },
    { title: 'Routing & Switching', topics: ['Router configuration', 'Switch VLANs and trunking', 'Static and dynamic routing', 'OSPF and RIP basics', 'Inter-VLAN routing'] },
    { title: 'Wireless & Security', topics: ['Wi-Fi standards and configuration', 'WPA2/WPA3 security', 'Firewalls and ACLs', 'VPN setup', 'Network monitoring tools'] },
    { title: 'Troubleshooting', topics: ['Ping, traceroute, nslookup', 'Wireshark packet analysis', 'Cable testing', 'Performance baselines', 'Incident documentation'] },
    { title: 'Certification Prep', topics: ['CompTIA Network+ objectives', 'Practice exams', 'On-site testing', 'Resume and interview prep', 'Career placement support'] },
  ],
  credentials: ['CompTIA Network+', 'IT Specialist — Networking (Certiport)', 'Certificate of Completion'],
  careers: [
    { title: 'Network Administrator', salary: '$60,000–$90,000' },
    { title: 'Network Technician', salary: '$45,000–$65,000' },
    { title: 'Systems Administrator', salary: '$65,000–$95,000' },
    { title: 'NOC Technician', salary: '$45,000–$60,000' },
  ],
  steps: [
    { title: 'Apply Online', desc: 'Complete our application in about 5 minutes.' },
    { title: 'Check Funding', desc: 'Register at Indiana Career Connect for WIOA eligibility.' },
    { title: 'Attend Orientation', desc: 'Meet your instructor and tour the networking lab.' },
    { title: 'Start Training', desc: 'Begin your 10-week network administration program.' },
  ],
  faqs: [
    { question: 'Do I need IT experience?', answer: 'Basic computer skills are recommended. CompTIA A+ is helpful but not required. We cover networking from the ground up.' },
    { question: 'Is CompTIA Network+ recognized by employers?', answer: 'Yes. CompTIA Network+ is one of the most widely recognized networking certifications. It is vendor-neutral and accepted by employers across all industries.' },
  ],
  applyHref: '/apply?program=network-administration',
  breadcrumbs: [{ label: 'Programs', href: '/programs' }, { label: 'Technology', href: '/programs/technology' }, { label: 'Network Administration' }],
};

export default function Page() {
  return (<><ProgramStructuredData program={{ id: 'network-administration', name: config.title, slug: 'network-administration', description: config.subtitle, duration_weeks: 10, price: 4890, image_url: `${SITE_URL}/images/programs-fresh/network-admin.jpg`, category: 'Technology', outcomes: config.credentials || [] }} /><ProgramPageLayout config={config} /></>);
}
