'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

// GOVERNMENT-GRADE FOOTER - Clean, senior, compliant
// 4 columns: About, Programs, Compliance & Trust, Access & Support
const footerSections = [
  {
    title: 'About',
    links: [
      { name: 'About Elevate', href: '/about' },
      { name: 'Our Mission', href: '/about/mission' },
      { name: 'Features', href: '/features' },
      { name: 'Credentials', href: '/credentials' },
      { name: 'Indiana Outcomes', href: '/outcomes/indiana' },
      { name: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Programs',
    links: [
      { name: 'Training Programs', href: '/programs' },
      { name: 'How It Works', href: '/how-it-works' },
      { name: 'Certifications', href: '/certifications' },
      { name: 'Apprenticeships', href: '/programs/barber-apprenticeship' },
      { name: 'Employer Partnerships', href: '/employer' },
      { name: 'Search Programs', href: '/search' },
    ],
  },
  {
    title: 'Funding',
    links: [
      { name: 'Funding Overview', href: '/funding' },
      { name: 'WIOA Eligibility', href: '/wioa-eligibility' },
      { name: 'Financial Aid', href: '/financial-aid' },
      { name: 'Scholarships', href: '/scholarships' },
      { name: 'Tuition & Fees', href: '/tuition-fees' },
    ],
  },
  {
    title: 'Compliance & Trust',
    links: [
      { name: 'Governance', href: '/governance' },
      { name: 'Accreditation', href: '/accreditation' },
      { name: 'Accessibility', href: '/accessibility' },
      { name: 'FERPA', href: '/ferpa' },
      { name: 'Refund Policy', href: '/refund-policy' },
      { name: 'Equal Opportunity', href: '/equal-opportunity' },
    ],
  },
  {
    title: 'Support',
    links: [
      { name: 'Help Center', href: '/help' },
      { name: 'FAQ', href: '/faq' },
      { name: 'Student Handbook', href: '/student-handbook' },
      { name: 'Grievance', href: '/grievance' },
      { name: 'Verify Credentials', href: '/verify' },
    ],
  },
  {
    title: 'Access',
    links: [
      { name: 'Student Portal', href: '/login' },
      { name: 'Employer Portal', href: '/employer' },
      { name: 'Partner Portal', href: '/partner/login' },
      { name: 'Apply Now', href: '/apply/student' },
    ],
  },
];

export default function SiteFooter() {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (title: string) => {
    setOpenSection(openSection === title ? null : title);
  };

  return (
    <footer style={{ backgroundColor: '#111827', color: 'white', display: 'block', padding: '40px 20px' }}>
      {/* Mobile: Accordion | Desktop: Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* Mobile Accordion - hidden, using grid on all sizes */}
        <div className="hidden space-y-0 divide-y divide-gray-800">
          {footerSections.map((section) => (
            <div key={section.title}>
              <button
                onClick={() => toggleSection(section.title)}
                className="w-full flex items-center justify-between py-4 text-left"
              >
                <span className="text-sm font-medium text-gray-300">{section.title}</span>
                <ChevronDown 
                  className={`w-4 h-4 text-gray-500 transition-transform ${
                    openSection === section.title ? 'rotate-180' : ''
                  }`} 
                />
              </button>
              {openSection === section.title && (
                <div className="pb-4 space-y-2">
                  {section.links.map((link) => (
                    <Link
                      key={link.name}
                      href={link.href}
                      className="block text-sm text-gray-400 hover:text-white py-1"
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          
        </div>

        {/* Desktop Grid - responsive columns for all sections */}
        {/* Desktop Grid - always visible */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-8">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-3">
                {section.title}
              </h3>
              <ul className="space-y-1">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="block py-1 text-sm text-gray-300 hover:text-white transition-colors min-h-[24px]"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          
        </div>
      </div>

      {/* Bottom Bar - Legal only */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <Image
                src="/logo.png"
                alt="Elevate"
                width={20}
                height={20}
                className="w-5 h-5"
              />
              <span className="text-xs text-gray-500">
                © {new Date().getFullYear()} Elevate for Humanity, Inc.
              </span>
            </div>
            <div className="flex justify-center gap-4 text-xs text-gray-500">
              <Link href="/terms-of-service" className="py-1 min-h-[24px] hover:text-white">Terms</Link>
              <Link href="/privacy-policy" className="py-1 min-h-[24px] hover:text-white">Privacy</Link>
              <Link href="/governance/security" className="py-1 min-h-[24px] hover:text-white">Security</Link>
              <Link href="/store/licenses" className="py-1 min-h-[24px] hover:text-white">Licensing</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
