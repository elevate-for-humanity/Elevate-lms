// Server Component - NO 'use client'
// This header renders on the server and is visible even with JS disabled

import Link from 'next/link';
import Image from 'next/image';
import Logo from '@/components/ui/Logo';
import LogoImage from '@/components/site/LogoImage';
import HeaderMobileMenu from './HeaderMobileMenu.client';
import HeaderDesktopNav from './HeaderDesktopNav';

// Marketing site navigation.
//
// Rule: this header is for first-time visitors — brand, mission, trust, outcomes,
// partners, and a single clear entry point into the LMS.
//
// Anything tied to studying, enrolling, accessing courses, or navigating programs
// belongs in the LMS navigation (components/lms/LMSNavigation.tsx), not here.
export const NAV_ITEMS = [
  {
    name: 'Programs',
    href: '/programs',
    subItems: [
      { name: '— Training Areas —', href: '/programs', isHeader: true },
      { name: 'Healthcare', href: '/programs/healthcare' },
      { name: 'Skilled Trades', href: '/programs/skilled-trades' },
      { name: 'HVAC Technician', href: '/programs/hvac-technician' },
      { name: 'Technology', href: '/programs/technology' },
      { name: 'Barber Apprenticeship', href: '/programs/barber-apprenticeship' },
      { name: 'Cosmetology Apprenticeship', href: '/programs/cosmetology-apprenticeship' },
      { name: 'Business & Finance', href: '/programs/finance-bookkeeping-accounting' },
      { name: 'Peer Recovery', href: '/programs/peer-recovery-specialist' },
      { name: 'Apprenticeships', href: '/programs/apprenticeships' },
      { name: 'All Programs →', href: '/programs' },
    ],
  },
  {
    name: 'Testing',
    href: '/testing',
    subItems: [
      { name: '— Certification Exams —', href: '/testing', isHeader: true },
      { name: 'All Testing Providers', href: '/testing' },
      { name: 'Certiport (Microsoft, Adobe)', href: '/testing/certiport' },
      { name: 'NHA Healthcare Exams', href: '/testing/nha' },
      { name: 'WorkKeys / NCRC', href: '/testing/workkeys' },
      { name: 'EPA 608 Certification', href: '/testing/epa608' },
      { name: 'ServSafe / AHLEI', href: '/testing/servsafe' },
      { name: '— Schedule —', href: '/testing/book', isHeader: true },
      { name: 'Book a Testing Session', href: '/testing/book' },
      { name: 'Verify a Credential', href: '/verify-credentials' },
    ],
  },
  {
    name: 'Employers',
    href: '/employer',
    subItems: [
      { name: '— Hire Graduates —', href: '/employer', isHeader: true },
      { name: 'Hire Our Graduates', href: '/for-employers' },
      { name: 'OJT Partnerships', href: '/partnerships' },
      { name: 'Post a Job', href: '/employer/post-job' },
      { name: '— Get Started —', href: '/apply/employer', isHeader: true },
      { name: 'Employer Application', href: '/apply/employer' },
      { name: 'Employer Portal', href: '/login?redirect=/employer/dashboard' },
    ],
  },
  {
    name: 'Partners',
    href: '/partners',
    subItems: [
      { name: '— Partner Types —', href: '/partners', isHeader: true },
      { name: 'Workforce Agencies', href: '/partners/workforce' },
      { name: 'Barbershop Partners', href: '/partners/barbershop-apprenticeship' },
      { name: 'Training Providers', href: '/partners/training-provider' },
      { name: 'Reentry Organizations', href: '/partners/reentry' },
      { name: 'Program Holders', href: '/program-holder' },
      { name: 'Become a Partner →', href: '/partners/join' },
    ],
  },
  {
    name: 'About',
    href: '/about',
    subItems: [
      { name: '— Organization —', href: '/about', isHeader: true },
      { name: 'About Us', href: '/about' },
      { name: 'Our Team', href: '/about/team' },
      { name: 'Outcomes', href: '/outcomes/indiana' },
      { name: 'Accreditation', href: '/accreditation' },
      { name: 'Compliance', href: '/compliance' },
      { name: '— More —', href: '/about', isHeader: true },
      { name: 'Platform Licensing', href: '/store/licensing' },
      { name: 'Rise Foundation', href: '/rise-foundation' },
      { name: 'Careers', href: '/careers' },
      { name: 'Contact Us', href: '/contact' },
    ],
  },
];

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 h-[70px] bg-white z-[9999] shadow-md" role="banner">
      <div className="max-w-7xl mx-auto w-full h-full flex items-center justify-between px-4 sm:px-6">
        {/* Logo - Always visible */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0" aria-label="Elevate for Humanity home">
          <LogoImage
            alt="Elevate"
            width={40}
            height={60}
            className="w-auto h-10"
            priority
          />
          <span className="font-bold text-lg text-slate-900 hidden sm:block">
            Elevate
          </span>
        </Link>

        {/* Desktop Navigation - Server rendered */}
        <HeaderDesktopNav items={NAV_ITEMS} />

        {/* CTA Buttons - Always visible */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Portal login — icon only to save space */}
          <Link
            href="/portals"
            className="text-slate-500 hover:text-slate-900 transition-colors"
            aria-label="Sign in to your portal"
            title="Sign in"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </Link>
          <Link
            href="/start"
            className="bg-brand-red-600 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-brand-red-700 transition-colors"
          >
            Check Eligibility
          </Link>
        </div>

        {/* Mobile Menu Toggle - Client component for interactivity */}
        <HeaderMobileMenu items={NAV_ITEMS} />
      </div>
    </header>
  );
}
