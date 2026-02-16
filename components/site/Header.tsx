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
      { name: '— WIOA Programs —', href: '/wioa-eligibility', isHeader: true },
      { name: 'CNA Training', href: '/programs/cna-certification' },
      { name: 'Medical Assistant', href: '/programs/medical-assistant' },
      { name: 'Phlebotomy', href: '/programs/phlebotomy-technician' },
      { name: 'HVAC Technician', href: '/programs/hvac-technician' },
      { name: 'CDL Training', href: '/programs/cdl-training' },
      { name: 'IT Support', href: '/programs/it-support' },
      { name: '— Apprenticeships —', href: '/apprenticeships', isHeader: true },
      { name: 'Barber Apprenticeship', href: '/programs/barber-apprenticeship' },
      { name: 'Cosmetology Apprenticeship', href: '/programs/cosmetology-apprenticeship' },
      { name: '— All Programs —', href: '/programs', isHeader: true },
      { name: 'View All Programs', href: '/programs' },
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
      { name: 'Our Mission', href: '/mission' },
      { name: 'How It Works', href: '/how-it-works' },
      { name: 'Success Stories', href: '/testimonials' },
      { name: 'Indiana Outcomes', href: '/outcomes/indiana' },
      { name: 'FAQ', href: '/faq' },
    ]
  },
  { 
    name: 'Platform', 
    href: '/store',
    subItems: [
      { name: 'Platform Overview', href: '/store' },
      { name: 'Licensing', href: '/store/licensing' },
      { name: 'Managed Platform', href: '/store/licensing/managed' },
      { name: 'Enterprise Access', href: '/store/licensing/enterprise' },
      { name: 'Demos', href: '/store/demos' },
      { name: 'Add-Ons', href: '/store/add-ons' },
    ]
  },
  { 
    name: 'Support', 
    href: '/support',
    subItems: [
      { name: 'Help Center', href: '/help' },
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
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
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
            href="/programs"
            className="border border-blue-600 text-blue-600 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-blue-50 transition-colors"
          >
            View Programs
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
