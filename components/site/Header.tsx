// Server Component - NO 'use client'
// This header renders on the server and is visible even with JS disabled

import Link from 'next/link';
import Image from 'next/image';
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
      { name: 'Business & Finance', href: '/programs/finance-bookkeeping-accounting' },
      { name: 'Peer Recovery', href: '/programs/peer-recovery-specialist' },
      { name: 'All Programs →', href: '/programs' },
      { name: '— Credentials —', href: '/credentials', isHeader: true },
      { name: 'Certifications', href: '/training/certifications' },
      { name: 'Apprenticeships', href: '/programs/apprenticeships' },
      { name: 'Credential Verification', href: '/verify-credentials' },
      { name: '— Funding —', href: '/funding', isHeader: true },
      { name: 'How Funding Works', href: '/funding/how-it-works' },
      { name: 'WIOA Eligibility', href: '/wioa-eligibility' },
      { name: 'Workforce Ready Grant', href: '/funding/wrg' },
      { name: 'JRI Funding', href: '/funding/jri' },
      { name: 'Job Ready Indy', href: '/funding/job-ready-indy' },
      { name: 'Apply Now →', href: '/apply' },
    ],
  },
  {
    name: 'Employers',
    href: '/employer',
    subItems: [
      { name: '— Hire Graduates —', href: '/employer', isHeader: true },
      { name: 'Employer Overview', href: '/employer' },
      { name: 'Hire Our Graduates', href: '/for-employers' },
      { name: 'OJT Partnerships', href: '/partnerships' },
      { name: 'Post a Job', href: '/employer/post-job' },
      { name: '— Get Started —', href: '/apply/employer', isHeader: true },
      { name: 'Employer Application', href: '/apply/employer' },
      { name: 'Employer Portal Login', href: '/login?redirect=/employer/dashboard' },
      { name: 'Employer Dashboard', href: '/employer/dashboard' },
    ],
  },
  {
    name: 'Partners',
    href: '/partners',
    subItems: [
      { name: '— Partner Types —', href: '/partners', isHeader: true },
      { name: 'All Partners', href: '/partners' },
      { name: 'Workforce Agencies', href: '/partners/workforce' },
      { name: 'Barbershop Partners', href: '/partners/barbershop-apprenticeship' },
      { name: 'Training Providers', href: '/partners/training-provider' },
      { name: 'Reentry Organizations', href: '/partners/reentry' },
      { name: 'Technology Partners', href: '/partners/technology' },
      { name: '— Program Holders —', href: '/program-holder', isHeader: true },
      { name: 'Program Holder Overview', href: '/program-holder' },
      { name: 'Apply as Program Holder', href: '/apply/program-holder' },
      { name: 'Program Holder Portal', href: '/login?redirect=/program-holder/dashboard' },
      { name: 'Become a Partner →', href: '/partners/join' },
    ],
  },
  {
    name: 'About',
    href: '/about',
    subItems: [
      { name: '— Organization —', href: '/about', isHeader: true },
      { name: 'About Us', href: '/about' },
      { name: 'Our Mission', href: '/mission' },
      { name: 'Founder', href: '/founder' },
      { name: 'Our Team', href: '/about/team' },
      { name: 'Governance', href: '/governance' },
      { name: 'Accreditation', href: '/accreditation' },
      { name: '— Outcomes —', href: '/outcomes/indiana', isHeader: true },
      { name: 'Indiana Outcomes', href: '/outcomes/indiana' },
      { name: 'Success Stories', href: '/testimonials' },
      { name: 'Impact', href: '/impact' },
      { name: 'Compliance & Security', href: '/compliance' },
      { name: '— Funding Programs —', href: '/funding', isHeader: true },
      { name: 'Federal Programs (WIOA)', href: '/funding/federal-programs' },
      { name: 'State Programs', href: '/funding/state-programs' },
      { name: 'DOL Apprenticeship', href: '/funding/dol' },
      { name: 'Grant Programs', href: '/funding/grant-programs' },
      { name: '— Get Involved —', href: '/about', isHeader: true },
      { name: 'Careers', href: '/careers' },
      { name: 'Volunteer', href: '/volunteer' },
      { name: 'Donate', href: '/donate' },
      { name: 'Contact Us', href: '/contact' },
    ],
  },
  {
    name: 'Platform',
    subItems: [
      { name: 'Platform Overview', href: '/platform' },
      { name: 'License the Platform', href: '/store/licensing' },
      { name: 'Compliance & Security', href: '/compliance' },
      { name: 'Demos', href: '/store/demos' },
      { name: 'Add-Ons & Tools', href: '/store/add-ons' },
    ],
  },
  {
    name: 'Rise Foundation',
    subItems: [
      { name: 'Mental Wellness', href: '/rise-foundation/trauma-recovery' },
      { name: 'Young Adult Wellness', href: '/rise-foundation/young-adult-wellness' },
      { name: 'CurvatureBody Sculpting', href: '/rise-foundation/curvature' },
      { name: 'Meri-Go-Round Products', href: '/rise-foundation#products' },
      { name: 'Free VITA Tax Prep', href: 'https://www.supersonicfastermoney.com/tax/rise-up-foundation' },
      { name: 'Events', href: '/rise-foundation/events' },
      { name: 'Donate to Rise', href: '/rise-foundation/donate' },
      { name: 'Get Involved', href: '/rise-foundation/get-involved' },
    ],
  },
  {
    name: 'Contact',
    href: '/contact',
    subItems: [
      { name: 'Contact Us', href: '/contact' },
      { name: 'FAQ', href: '/faq' },
      { name: 'Help Center', href: '/support/help' },
    ],
  },
];

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 h-[70px] bg-white z-[9999] shadow-md" role="banner">
      <div className="max-w-7xl mx-auto w-full h-full flex items-center justify-between px-4 sm:px-6">
        {/* Logo - Always visible */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0" aria-label="Elevate for Humanity home">
          <Image
            src="/logo.png"
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
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-slate-700 hover:text-slate-900 font-medium text-sm"
          >
            Sign In
          </Link>
          <Link
            href="/apply/student"
            className="bg-brand-red-600 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-brand-red-700 transition-colors"
          >
            Apply Now
          </Link>
        </div>

        {/* Mobile Menu Toggle - Client component for interactivity */}
        <HeaderMobileMenu items={NAV_ITEMS} />
      </div>
    </header>
  );
}
