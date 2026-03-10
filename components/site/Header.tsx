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
      { name: '— Skilled Trades —', href: '/programs/skilled-trades', isHeader: true },
      { name: 'HVAC Technician', href: '/programs/hvac-technician' },
      { name: 'CDL Training', href: '/programs/cdl-training' },
      { name: 'Electrical', href: '/programs/electrical' },
      { name: 'Welding', href: '/programs/welding' },
      { name: 'Plumbing', href: '/programs/plumbing' },
      { name: '— Business & Finance —', href: '/programs/business', isHeader: true },
      { name: 'Bookkeeping', href: '/programs/bookkeeping' },
      { name: 'Entrepreneurship', href: '/programs/entrepreneurship' },
      { name: 'Tax Preparation', href: '/programs/tax-preparation' },
      { name: '— Technology —', href: '/programs/technology', isHeader: true },
      { name: 'IT Help Desk', href: '/programs/it-help-desk' },
      { name: 'Cybersecurity', href: '/programs/cybersecurity-analyst' },
      { name: 'Web Development', href: '/programs/web-development' },
      { name: '— Social Services —', href: '/programs', isHeader: true },
      { name: 'Peer Recovery Specialist', href: '/programs/peer-recovery-specialist' },
      { name: '— Beauty & Wellness —', href: '/programs', isHeader: true },
      { name: 'Barber Apprenticeship', href: '/programs/barber-apprenticeship' },
      { name: 'Cosmetology', href: '/programs/cosmetology-apprenticeship' },
      { name: 'Nail Technician', href: '/programs/nail-technician-apprenticeship' },
      { name: '— Credentials —', href: '/credentials', isHeader: true },
      { name: 'All Credentials', href: '/credentials' },
      { name: 'Certifications', href: '/training/certifications' },
      { name: 'Apprenticeships', href: '/programs/apprenticeships' },
      { name: '— All Programs —', href: '/programs', isHeader: true },
      { name: 'View All Programs →', href: '/programs' },
    ]
  },
  { 
    name: 'Funding', 
    href: '/funding',
    subItems: [
      { name: 'Funding Overview', href: '/funding' },
      { name: 'How Funding Works', href: '/funding/how-it-works' },
      { name: '— Federal & State —', href: '/funding', isHeader: true },
      { name: 'WIOA Eligibility', href: '/wioa-eligibility' },
      { name: 'Federal Programs', href: '/funding/federal-programs' },
      { name: 'State Programs', href: '/funding/state-programs' },
      { name: 'Workforce Ready Grant', href: '/funding/wrg' },
      { name: 'DOL Apprenticeship', href: '/funding/dol' },
      { name: 'JRI Funding', href: '/funding/jri' },
      { name: 'Grant Programs', href: '/funding/grant-programs' },
      { name: '— Costs & Aid —', href: '/funding', isHeader: true },
      { name: 'Tuition & Fees', href: '/tuition-fees' },
      { name: 'Financial Aid', href: '/financial-aid' },
      { name: 'Scholarships', href: '/scholarships' },
    ]
  },
  { 
    name: 'About', 
    href: '/about',
    subItems: [
      { name: 'About Elevate', href: '/about' },
      { name: 'Our Team', href: '/about/team' },
      { name: 'Founder', href: '/founder' },
      { name: 'Our Mission', href: '/mission' },
      { name: 'Governance', href: '/governance' },
      { name: 'Accreditation', href: '/accreditation' },
      { name: '— Results —', href: '/about', isHeader: true },
      { name: 'How It Works', href: '/how-it-works' },
      { name: 'Success Stories', href: '/testimonials' },
      { name: 'Indiana Outcomes', href: '/outcomes/indiana' },
      { name: 'Impact', href: '/impact' },
      { name: '— Get Involved —', href: '/about', isHeader: true },
      { name: 'Careers', href: '/careers' },
      { name: 'Volunteer', href: '/volunteer' },
      { name: 'Donate', href: '/donate' },
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
      { name: 'Donate to Rise', href: '/rise-foundation/donate' },
      { name: 'Get Involved', href: '/rise-foundation/get-involved' },
    ]
  },
  { 
    name: 'Partners', 
    href: '/partners',
    subItems: [
      { name: 'All Partners', href: '/partners' },
      { name: '— Partner Types —', href: '/partners', isHeader: true },
      { name: 'Program Holder', href: '/program-holder', nested: true },
      { name: 'Barbershop Partner', href: '/partners/barbershop-apprenticeship', nested: true },
      { name: 'Employers & OJT', href: '/partnerships', nested: true },
      { name: 'Workforce Agencies', href: '/partners/workforce', nested: true },
      { name: 'Training Providers', href: '/partners/training-provider', nested: true },
      { name: 'Training Sites', href: '/partners/training-sites', nested: true },
      { name: 'Reentry Organizations', href: '/partners/reentry', nested: true },
      { name: '— Barbershop Onboarding —', href: '/partners/barbershop-apprenticeship', isHeader: true },
      { name: 'Partner Application', href: '/partners/barbershop-apprenticeship/apply', nested: true },
      { name: 'Partner Handbook', href: '/partners/barbershop-apprenticeship/handbook', nested: true },
      { name: 'Required Forms', href: '/partners/barbershop-apprenticeship/forms', nested: true },
      { name: 'Sign MOU', href: '/partners/barbershop-apprenticeship/sign-mou', nested: true },
      { name: 'Policy Acknowledgment', href: '/partners/barbershop-apprenticeship/policy-acknowledgment', nested: true },
      { name: '— Portals —', href: '/partners', isHeader: true },
      { name: 'Partner Login', href: '/partner/login', nested: true },
      { name: 'Employer Portal', href: '/apply/employer', nested: true },
      { name: 'Become a Partner', href: '/partners/join', nested: true },
    ]
  },
  {
    name: 'Dashboards',
    href: '/portals',
    subItems: [
      { name: '— Students —', href: '/portals', isHeader: true },
      { name: 'Student Dashboard', href: '/learner/dashboard' },
      { name: 'LMS / My Courses', href: '/lms/dashboard' },
      { name: '— Staff & Instructors —', href: '/portals', isHeader: true },
      { name: 'Admin Dashboard', href: '/admin/dashboard' },
      { name: 'Staff Portal', href: '/staff-portal/dashboard' },
      { name: 'Instructor Dashboard', href: '/instructor/dashboard' },
      { name: '— Partners & Employers —', href: '/portals', isHeader: true },
      { name: 'Employer Dashboard', href: '/employer/dashboard' },
      { name: 'Employer Portal', href: '/employer-portal' },
      { name: 'Partner Dashboard', href: '/partner/dashboard' },
      { name: 'Partner Portal', href: '/partner-portal' },
      { name: 'Program Holder Dashboard', href: '/program-holder/dashboard' },
      { name: '— Other Roles —', href: '/portals', isHeader: true },
      { name: 'Mentor Dashboard', href: '/mentor/dashboard' },
      { name: 'Creator Dashboard', href: '/creator/dashboard' },
      { name: 'Workforce Board', href: '/workforce-board/dashboard' },
      { name: '— All Portals —', href: '/portals', isHeader: true },
      { name: 'View All Portals →', href: '/portals' },
    ],
  },
  { 
    name: 'Support', 
    href: '/support',
    subItems: [
      { name: 'Employment Support', href: '/employment-support' },
      { name: 'Career Services', href: '/career-services' },
      { name: 'Student Handbook', href: '/student-handbook' },
      { name: '— Student Resources —', href: '/support', isHeader: true },
      { name: 'Orientation', href: '/orientation' },
      { name: 'Resources', href: '/resources' },
      { name: 'Academic Calendar', href: '/academic-calendar' },
      { name: 'Grievance', href: '/grievance' },
      { name: '— Help —', href: '/support', isHeader: true },
      { name: 'Help Center', href: '/support/help' },
      { name: 'Contact Us', href: '/contact' },
      { name: 'FAQ', href: '/faq' },
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
