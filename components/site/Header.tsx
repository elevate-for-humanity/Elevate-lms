// Server Component - NO 'use client'
// This header renders on the server and is visible even with JS disabled

import Link from 'next/link';
import Image from 'next/image';
import HeaderMobileMenu from './HeaderMobileMenu.client';
import HeaderDesktopNav from './HeaderDesktopNav';

// Navigation structure
export const NAV_ITEMS = [
  { 
    name: 'Programs', 
    href: '/programs',
    subItems: [
      { name: '— Healthcare —', href: '/programs', isHeader: true },
      { name: 'CNA Training', href: '/programs/cna' },
      { name: 'Medical Assistant', href: '/programs/medical-assistant' },
      { name: 'Pharmacy Technician', href: '/programs/pharmacy-technician' },
      { name: 'Phlebotomy', href: '/programs/healthcare' },
      { name: 'CPR & First Aid', href: '/programs/cpr-first-aid' },
      { name: '— Skilled Trades —', href: '/programs', isHeader: true },
      { name: 'HVAC Technician', href: '/programs/hvac-technician' },
      { name: 'CDL Training', href: '/programs/cdl-training' },
      { name: 'Electrical', href: '/programs/electrical' },
      { name: 'Welding', href: '/programs/welding' },
      { name: 'Plumbing', href: '/programs/plumbing' },
      { name: '— Business & Finance —', href: '/programs', isHeader: true },
      { name: 'Bookkeeping', href: '/programs/bookkeeping' },
      { name: 'Entrepreneurship', href: '/programs/entrepreneurship' },
      { name: 'Tax Preparation', href: '/programs/tax-preparation' },
      { name: '— Technology —', href: '/programs', isHeader: true },
      { name: 'IT Help Desk', href: '/programs/it-help-desk' },
      { name: 'Cybersecurity', href: '/programs/cybersecurity-analyst' },
      { name: 'Web Development', href: '/programs/web-development' },
      { name: '— Social Services —', href: '/programs', isHeader: true },
      { name: 'Peer Recovery Specialist', href: '/programs/peer-recovery-specialist' },
      { name: '— Beauty & Wellness —', href: '/programs', isHeader: true },
      { name: 'Barber Apprenticeship', href: '/programs/barber-apprenticeship' },
      { name: 'Cosmetology', href: '/programs/cosmetology-apprenticeship' },
      { name: 'Nail Technician', href: '/programs/nail-technician-apprenticeship' },
      { name: '— All Programs —', href: '/programs', isHeader: true },
      { name: 'View All Programs →', href: '/programs' },
    ]
  },
  { 
    name: 'Funding', 
    href: '/funding',
    subItems: [
      { name: 'Funding Overview', href: '/funding' },
      { name: 'WIOA Funding', href: '/wioa-eligibility' },
      { name: 'Financial Aid', href: '/financial-aid' },
      { name: 'Tuition & Fees', href: '/tuition-fees' },
      { name: 'Scholarships', href: '/scholarships' },
    ]
  },
  { 
    name: 'About', 
    href: '/about',
    subItems: [
      { name: 'About Elevate', href: '/about' },
      { name: 'Our Team', href: '/about/team' },
      { name: 'Our Mission', href: '/mission' },
      { name: 'How It Works', href: '/how-it-works' },
      { name: 'Success Stories', href: '/testimonials' },
      { name: 'Indiana Outcomes', href: '/outcomes/indiana' },
      { name: 'Partnerships', href: '/partnerships' },
      { name: 'Barbershop Partners', href: '/partners/barbershop-apprenticeship' },
      { name: 'FAQ', href: '/faq' },
    ]
  },
  { 
    name: 'Platform', 
    href: '/platform',
    subItems: [
      { name: 'Platform Overview', href: '/platform' },
      { name: 'License the Platform', href: '/store/licensing' },
      { name: 'Compliance & Security', href: '/compliance' },
      { name: 'Demos', href: '/store/demos' },
      { name: 'Add-Ons & Tools', href: '/store/add-ons' },
    ]
  },
  {
    name: 'Rise Foundation',
    href: '/rise-foundation',
    subItems: [
      { name: 'Mental Wellness', href: '/rise-foundation/trauma-recovery' },
      { name: 'CurvatureBody Sculpting', href: '/rise-foundation#curvature' },
      { name: 'Meri-Go-Round Products', href: '/rise-foundation#products' },
      { name: 'Free VITA Tax Prep', href: '/tax/rise-up-foundation' },
      { name: 'Events', href: '/rise-foundation/events' },
      { name: 'Donate', href: '/rise-foundation/donate' },
      { name: 'Get Involved', href: '/rise-foundation/get-involved' },
    ]
  },
  { 
    name: 'For Employers', 
    href: '/employers',
    subItems: [
      { name: 'Hire Trained Talent', href: '/employers' },
      { name: 'Partner With Us', href: '/partnerships' },
      { name: 'Apprenticeship Sponsors', href: '/funding/dol' },
      { name: 'Employer Portal', href: '/apply/employer' },
    ]
  },
  { 
    name: 'Support', 
    href: '/support',
    subItems: [
      { name: 'Help Center', href: '/support/help' },
      { name: 'Contact Us', href: '/contact' },
      { name: 'FAQ', href: '/faq' },
      { name: 'Schedule & Calendar', href: '/academic-calendar' },
    ]
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
            height={40}
            className="w-10 h-10"
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
