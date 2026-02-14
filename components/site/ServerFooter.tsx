// Server Component - NO 'use client'
// Government-grade footer - clean, senior, compliant

import Link from 'next/link';
import Image from 'next/image';

// GOVERNMENT-GRADE FOOTER STRUCTURE
// 4 columns: About, Programs, Compliance & Trust, Access
// Bottom bar: Legal links only
// Principle: If a first-time visitor or government reviewer wouldn't expect to see it, remove it

const footerLinks = {
  programs: [
    { name: 'All Programs', href: '/programs' },
    { name: 'Healthcare Training', href: '/programs/healthcare' },
    { name: 'Skilled Trades', href: '/programs/skilled-trades' },
    { name: 'CDL Training', href: '/programs/cdl-training' },
    { name: 'Apprenticeships', href: '/programs/barber-apprenticeship' },
    { name: 'Apply Now', href: '/apply/student' },
  ],
  funding: [
    { name: 'Funding Overview', href: '/funding' },
    { name: 'WIOA Funding', href: '/wioa-eligibility' },
    { name: 'Financial Aid', href: '/financial-aid' },
    { name: 'Tuition & Fees', href: '/tuition-fees' },
    { name: 'Scholarships', href: '/scholarships' },
  ],
  about: [
    { name: 'About Elevate', href: '/about' },
    { name: 'Our Mission', href: '/mission' },
    { name: 'How It Works', href: '/how-it-works' },
    { name: 'Success Stories', href: '/success-stories' },
    { name: 'Indiana Outcomes', href: '/outcomes/indiana' },
  ],
  support: [
    { name: 'Help Center', href: '/help' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Contact Us', href: '/contact' },
    { name: 'Schedule & Calendar', href: '/academic-calendar' },
    { name: 'Student Handbook', href: '/student-handbook' },
  ],
  access: [
    { name: 'Student Portal', href: '/login' },
    { name: 'Employer Partners', href: '/employer' },
    { name: 'Partner Portal', href: '/partner/login' },
    { name: 'Verify Credentials', href: '/verify' },
  ],
  legal: [
    { name: 'Terms of Service', href: '/terms-of-service' },
    { name: 'Privacy Policy', href: '/privacy-policy' },
    { name: 'Accessibility', href: '/accessibility' },
    { name: 'Governance', href: '/governance' },
  ],
};

export default function ServerFooter() {
  return (
    <footer className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 5-Column Footer */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-12">
          {/* Column 1: Programs */}
          <div>
            <h3 className="font-semibold mb-4 text-white text-sm uppercase tracking-wide">Programs</h3>
            <ul className="space-y-3">
              {footerLinks.programs.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-slate-300 hover:text-white text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Funding */}
          <div>
            <h3 className="font-semibold mb-4 text-white text-sm uppercase tracking-wide">Funding</h3>
            <ul className="space-y-3">
              {footerLinks.funding.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-slate-300 hover:text-white text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: About */}
          <div>
            <h3 className="font-semibold mb-4 text-white text-sm uppercase tracking-wide">About</h3>
            <ul className="space-y-3">
              {footerLinks.about.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-slate-300 hover:text-white text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Support */}
          <div>
            <h3 className="font-semibold mb-4 text-white text-sm uppercase tracking-wide">Support</h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-slate-300 hover:text-white text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 5: Access */}
          <div>
            <h3 className="font-semibold mb-4 text-white text-sm uppercase tracking-wide">Access</h3>
            <ul className="space-y-3">
              {footerLinks.access.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-slate-300 hover:text-white text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Equal Opportunity Statement */}
        <div className="border-t border-slate-800 pt-6 pb-4">
          <p className="text-slate-400 text-xs leading-relaxed max-w-4xl mx-auto text-center">
            Elevate for Humanity is an equal opportunity provider and employer. We do not discriminate on the basis of race, color, national origin, sex, disability, or age in our programs, activities, or employment. Auxiliary aids and services are available upon request to individuals with disabilities.
          </p>
        </div>

        {/* Bottom Bar: Legal Links + Copyright */}
        <div className="border-t border-slate-800 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Logo and Copyright */}
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Elevate"
                width={28}
                height={28}
                className="w-7 h-7"
              />
              <p className="text-slate-300 text-sm">
                © {new Date().getFullYear()} Elevate for Humanity. All rights reserved.
              </p>
            </div>
            
            {/* Legal Links */}
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              {footerLinks.legal.map((link) => (
                <Link 
                  key={link.name}
                  href={link.href} 
                  className="text-slate-300 hover:text-white"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
