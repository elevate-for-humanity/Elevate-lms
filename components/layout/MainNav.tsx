'use client';

import React from 'react';
// components/layout/MainNav.tsx

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown, Search } from 'lucide-react';
import clsx from 'clsx';
import { PremiumMobileNav } from './PremiumMobileNav';

// Student Portal URL
const STUDENT_PORTAL_URL = '/portal';

// Main Programs dropdown items (Elevate-run programs)
const programsLinks = [
  { href: '/programs/cna', label: 'CNA Training' },
  { href: '/programs/barber-apprenticeship', label: 'Barber Apprenticeship' },
  { href: '/programs/healthcare', label: 'Healthcare Programs' },
  { href: '/programs/skilled-trades', label: 'Skilled Trades' },
  { href: '/programs/cdl-transportation', label: 'CDL / Transportation' },
  { href: '/programs/business-financial', label: 'Business & Financial' },
  { href: '/programs/tax-preparation', label: 'Tax Preparation' },
  { href: '/programs', label: 'View All Programs →' },
];

// Micro Classes dropdown items (Partner programs)
const microClassesLinks = [
  { href: '/micro-classes#cpr-certification', label: 'CPR Certification' },
  { href: '/micro-classes#phlebotomy', label: 'Phlebotomy Technician' },
  { href: '/micro-classes#ekg-technician', label: 'EKG Technician' },
  { href: '/micro-classes#pharmacy-technician', label: 'Pharmacy Technician' },
  { href: '/micro-classes#dental-assistant', label: 'Dental Assistant' },
  {
    href: '/micro-classes#patient-care-technician',
    label: 'Patient Care Technician',
  },
  { href: '/micro-classes#sterile-processing', label: 'Sterile Processing' },
  {
    href: '/micro-classes#healthcare-administration',
    label: 'Healthcare Administration',
  },
  { href: '/micro-classes', label: 'View All Micro Classes →' },
];

// Funding dropdown items
const fundingLinks = [
  { href: '/funding/state-programs', label: 'State Programs' },
  { href: '/funding/federal-programs', label: 'Federal Programs' },
];

// Simplified top-level navigation - STUDENT FOCUSED
const mainLinks = [
  { href: '/programs', label: 'Programs' },
  { href: '/funding', label: 'Funding' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

// Resources & Tools dropdown
const resourcesLinks = [
  { href: '/ai-tutor', label: 'AI Tutor' },
  { href: '/ai-chat', label: 'AI Chat' },
  { href: '/ai-studio', label: 'AI Studio' },
  { href: '/lessons', label: 'Lessons' },
  { href: '/workbooks', label: 'Workbooks' },
  { href: '/syllabi', label: 'Syllabi' },
  { href: '/student-handbook', label: 'Student Handbook' },
  { href: '/orientation', label: 'Orientation' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/mentor', label: 'Find a Mentor' },
  { href: '/groups', label: 'Study Groups' },
];

// Services dropdown
const servicesLinks = [
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/shop', label: 'Shop' },
  { href: '/booking', label: 'Book Appointment' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/advising', label: 'Advising' },
  { href: '/banking', label: 'Banking Services' },
  { href: '/payment', label: 'Make Payment' },
  { href: '/donate', label: 'Donate' },
];

// Community dropdown
const communityLinks = [
  { href: '/news', label: 'News & Updates' },
  { href: '/chat', label: 'Community Chat' },
  { href: '/messages', label: 'Messages' },
  { href: '/video', label: 'Videos' },
  { href: '/events', label: 'Events' },
];

// "More" dropdown - hidden from main nav, accessible via /partners or direct URL
const moreLinks = [
  { href: '/employers', label: 'For Employers' },
  { href: '/faq', label: 'FAQ' },
];

// Student features (authenticated users only)
const studentFeatureLinks = [
  { href: '/ai-tutor', label: 'AI Tutor', icon: '🤖' },
  { href: '/student/badges', label: 'Achievements', icon: '🏆' },
  { href: '/student/leaderboard', label: 'Leaderboard', icon: '📊' },
];

// Portal/Dashboard links (role-based, not in public nav)
const portalLinks = [
  { href: '/admin', label: 'Admin Portal' },
  { href: '/staff-portal', label: 'Staff Portal' },
  { href: '/employer', label: 'Employer Portal' },
  { href: '/partner', label: 'Partner Portal' },
  { href: '/program-holder', label: 'Program Holder Portal' },
  { href: '/lms', label: 'LMS Portal' },
  { href: '/parent-portal', label: 'Parent Portal' },
];

export function MainNav() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [programsOpen, setProgramsOpen] = useState(false);
  const [microClassesOpen, setMicroClassesOpen] = useState(false);
  const [fundingOpen, setFundingOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [communityOpen, setCommunityOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [mobileProgramsOpen, setMobileProgramsOpen] = useState(false);
  const [mobileMicroClassesOpen, setMobileMicroClassesOpen] = useState(false);
  const [mobileFundingOpen, setMobileFundingOpen] = useState(false);
  const [portalsOpen, setPortalsOpen] = useState(false);
  const [mobilePortalsOpen, setMobilePortalsOpen] = useState(false);

  // Timeout refs for delayed closing - use useRef instead of useState
  const [programsTimeoutRef, setProgramsTimeoutRef] =
    useState<NodeJS.Timeout | null>(null);
  const [microClassesTimeoutRef, setMicroClassesTimeoutRef] =
    useState<NodeJS.Timeout | null>(null);
  const [fundingTimeoutRef, setFundingTimeoutRef] =
    useState<NodeJS.Timeout | null>(null);

  // Detect if device is touch-enabled
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // Helper functions for delayed dropdown closing (desktop hover)
  const handleProgramsEnter = () => {
    if (isTouchDevice) return;
    if (programsTimeoutRef) clearTimeout(programsTimeoutRef);
    setProgramsOpen(true);
  };

  const handleProgramsLeave = () => {
    if (isTouchDevice) return;
    const timeout = setTimeout(() => setProgramsOpen(false), 500);
    setProgramsTimeoutRef(timeout);
  };

  const handleMicroClassesEnter = () => {
    if (isTouchDevice) return;
    if (microClassesTimeoutRef) clearTimeout(microClassesTimeoutRef);
    setMicroClassesOpen(true);
  };

  const handleMicroClassesLeave = () => {
    if (isTouchDevice) return;
    const timeout = setTimeout(() => setMicroClassesOpen(false), 500);
    setMicroClassesTimeoutRef(timeout);
  };

  const handleFundingEnter = () => {
    if (isTouchDevice) return;
    if (fundingTimeoutRef) clearTimeout(fundingTimeoutRef);
    setFundingOpen(true);
  };

  const handleFundingLeave = () => {
    if (isTouchDevice) return;
    const timeout = setTimeout(() => setFundingOpen(false), 500);
    setFundingTimeoutRef(timeout);
  };

  // Click handlers for touch devices
  const handleProgramsClick = () => {
    if (isTouchDevice) {
      setProgramsOpen(!programsOpen);
      setMicroClassesOpen(false);
      setFundingOpen(false);
    }
  };

  const handleMicroClassesClick = () => {
    if (isTouchDevice) {
      setMicroClassesOpen(!microClassesOpen);
      setProgramsOpen(false);
      setFundingOpen(false);
    }
  };

  const handleFundingClick = () => {
    if (isTouchDevice) {
      setFundingOpen(!fundingOpen);
      setProgramsOpen(false);
      setMicroClassesOpen(false);
    }
  };

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setProgramsOpen(false);
    setMicroClassesOpen(false);
    setFundingOpen(false);
  }, [pathname]);

  return (
    <>
      <header
        className="border-b border-slate-200 bg-white/95 backdrop-blur sticky top-0 z-40"
        role="banner"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-3 md:px-10">
          {/* Logo / Brand */}
          <Link
            href="/"
            className="flex items-center gap-2"
            aria-label="Elevate For Humanity Home"
          >
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-orange-500 text-white text-xs font-black uppercase"
              aria-hidden="true"
            >
              EFH
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-black">
                Elevate For Humanity
              </span>
              <span className="hidden sm:block text-[11px] text-black">
                Career &amp; Technical Institute
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav
            className="hidden items-center gap-6 text-xs md:flex"
            role="navigation"
            aria-label="Main navigation"
          >
            {/* Programs Dropdown */}
            <div
              className="relative"
              onMouseEnter={handleProgramsEnter}
              onMouseLeave={handleProgramsLeave}
            >
              <button
                className={clsx(
                  'flex items-center gap-1 min-h-[44px] py-3 px-2 transition hover:text-brand-orange-600',
                  pathname?.startsWith('/programs')
                    ? 'text-brand-orange-600 font-semibold'
                    : 'text-black'
                )}
                onClick={handleProgramsClick}
                aria-expanded={programsOpen}
                aria-haspopup="true"
              >
                Programs
                <ChevronDown
                  size={14}
                  className={clsx(
                    'transition-transform',
                    programsOpen && 'rotate-180'
                  )}
                />
              </button>

              {programsOpen && (
                <div className="absolute top-full left-0 pt-2 z-50">
                  <div className="w-64 bg-white rounded-lg shadow-xl border border-slate-200 py-2">
                    {programsLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={clsx(
                          'block px-4 py-2 text-xs transition hover:bg-red-50 hover:text-brand-orange-600',
                          pathname === link.href
                            ? 'text-brand-orange-600 font-semibold bg-red-50'
                            : 'text-black'
                        )}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Micro Classes Dropdown */}
            <div
              className="relative"
              onMouseEnter={handleMicroClassesEnter}
              onMouseLeave={handleMicroClassesLeave}
            >
              <button
                className={clsx(
                  'flex items-center gap-1 min-h-[44px] py-3 px-2 transition hover:text-brand-orange-600',
                  pathname?.startsWith('/micro-classes')
                    ? 'text-brand-orange-600 font-semibold'
                    : 'text-black'
                )}
                onClick={handleMicroClassesClick}
                aria-expanded={microClassesOpen}
                aria-haspopup="true"
              >
                Micro Classes
                <ChevronDown
                  size={14}
                  className={clsx(
                    'transition-transform',
                    microClassesOpen && 'rotate-180'
                  )}
                />
              </button>

              {microClassesOpen && (
                <div className="absolute top-full left-0 pt-2 z-50">
                  <div className="w-64 bg-white rounded-lg shadow-xl border border-slate-200 py-2">
                    {microClassesLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={clsx(
                          'block px-4 py-2 text-xs transition hover:bg-red-50 hover:text-brand-orange-600',
                          pathname === link.href
                            ? 'text-brand-orange-600 font-semibold bg-red-50'
                            : 'text-black'
                        )}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Funding Dropdown */}
            <div
              className="relative"
              onMouseEnter={handleFundingEnter}
              onMouseLeave={handleFundingLeave}
            >
              <button
                className={clsx(
                  'flex items-center gap-1 min-h-[44px] py-3 px-2 transition hover:text-brand-orange-600',
                  pathname?.startsWith('/funding')
                    ? 'text-brand-orange-600 font-semibold'
                    : 'text-black'
                )}
                onClick={handleFundingClick}
                aria-expanded={fundingOpen}
                aria-haspopup="true"
              >
                Funding
                <ChevronDown
                  size={14}
                  className={clsx(
                    'transition-transform',
                    fundingOpen && 'rotate-180'
                  )}
                />
              </button>

              {fundingOpen && (
                <div className="absolute top-full left-0 pt-2 z-50">
                  <div className="w-56 bg-white rounded-lg shadow-xl border border-slate-200 py-2">
                    {fundingLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={clsx(
                          'block px-4 py-2 text-xs transition hover:bg-red-50 hover:text-brand-orange-600',
                          pathname === link.href
                            ? 'text-brand-orange-600 font-semibold bg-red-50'
                            : 'text-black'
                        )}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Resources Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setResourcesOpen(true)}
              onMouseLeave={() => setResourcesOpen(false)}
            >
              <button
                className={clsx(
                  'flex items-center gap-1 min-h-[44px] py-3 px-2 transition hover:text-brand-orange-600',
                  'text-black'
                )}
                aria-expanded={resourcesOpen}
                aria-haspopup="true"
              >
                Resources
                <ChevronDown
                  size={14}
                  className={clsx(
                    'transition-transform',
                    resourcesOpen && 'rotate-180'
                  )}
                />
              </button>

              {resourcesOpen && (
                <div className="absolute top-full left-0 pt-2 z-50">
                  <div className="w-56 bg-white rounded-lg shadow-xl border border-slate-200 py-2">
                    {resourcesLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="block px-4 py-2 text-xs transition hover:bg-red-50 hover:text-brand-orange-600 text-black"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Services Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setServicesOpen(true)}
              onMouseLeave={() => setServicesOpen(false)}
            >
              <button
                className={clsx(
                  'flex items-center gap-1 min-h-[44px] py-3 px-2 transition hover:text-brand-orange-600',
                  'text-black'
                )}
                aria-expanded={servicesOpen}
                aria-haspopup="true"
              >
                Services
                <ChevronDown
                  size={14}
                  className={clsx(
                    'transition-transform',
                    servicesOpen && 'rotate-180'
                  )}
                />
              </button>

              {servicesOpen && (
                <div className="absolute top-full left-0 pt-2 z-50">
                  <div className="w-56 bg-white rounded-lg shadow-xl border border-slate-200 py-2">
                    {servicesLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="block px-4 py-2 text-xs transition hover:bg-red-50 hover:text-brand-orange-600 text-black"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Community Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setCommunityOpen(true)}
              onMouseLeave={() => setCommunityOpen(false)}
            >
              <button
                className={clsx(
                  'flex items-center gap-1 min-h-[44px] py-3 px-2 transition hover:text-brand-orange-600',
                  'text-black'
                )}
                aria-expanded={communityOpen}
                aria-haspopup="true"
              >
                Community
                <ChevronDown
                  size={14}
                  className={clsx(
                    'transition-transform',
                    communityOpen && 'rotate-180'
                  )}
                />
              </button>

              {communityOpen && (
                <div className="absolute top-full left-0 pt-2 z-50">
                  <div className="w-56 bg-white rounded-lg shadow-xl border border-slate-200 py-2">
                    {communityLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="block px-4 py-2 text-xs transition hover:bg-red-50 hover:text-brand-orange-600 text-black"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* More Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setMoreOpen(true)}
              onMouseLeave={() => setMoreOpen(false)}
            >
              <button
                className={clsx(
                  'flex items-center gap-1 min-h-[44px] py-3 px-2 transition hover:text-brand-orange-600',
                  'text-black'
                )}
                aria-expanded={moreOpen}
                aria-haspopup="true"
              >
                More
                <ChevronDown
                  size={14}
                  className={clsx(
                    'transition-transform',
                    moreOpen && 'rotate-180'
                  )}
                />
              </button>

              {moreOpen && (
                <div className="absolute top-full left-0 pt-2 z-50">
                  <div className="w-56 bg-white rounded-lg shadow-xl border border-slate-200 py-2">
                    {moreLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="block px-4 py-2 text-xs transition hover:bg-red-50 hover:text-brand-orange-600 text-black"
                      >
                        {link.label}
                        {link.badge && (
                          <span className="ml-2 text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-bold">
                            {link.badge}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Portals Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setPortalsOpen(true)}
              onMouseLeave={() => setPortalsOpen(false)}
            >
              <button
                className={clsx(
                  'flex items-center gap-1 transition hover:text-brand-orange-600',
                  pathname?.startsWith('/portal') ||
                    pathname?.startsWith('/lms') ||
                    pathname?.startsWith('/admin')
                    ? 'text-brand-orange-600 font-semibold'
                    : 'text-black'
                )}
                aria-expanded={portalsOpen}
                aria-haspopup="true"
              >
                Portals
                <ChevronDown
                  size={14}
                  className={clsx(
                    'transition-transform',
                    portalsOpen && 'rotate-180'
                  )}
                />
              </button>

              {portalsOpen && (
                <div className="absolute top-full left-0 pt-2 z-50">
                  <div className="w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-2">
                    {portalLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={clsx(
                          'block px-4 py-2 text-xs transition hover:bg-red-50 hover:text-brand-orange-600',
                          pathname === link.href
                            ? 'text-brand-orange-600 font-semibold bg-red-50'
                            : 'text-black'
                        )}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Main Links */}
            {mainLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                {...(link.external
                  ? { target: '_blank', rel: 'noopener noreferrer' }
                  : {})}
                className={clsx(
                  'transition hover:text-brand-orange-600',
                  pathname?.startsWith(link.href)
                    ? 'text-brand-orange-600 font-semibold'
                    : 'text-black'
                )}
                aria-current={
                  pathname?.startsWith(link.href) ? 'page' : undefined
                }
              >
                {link.label}
              </Link>
            ))}

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="search"
                placeholder="Search programs..."
                className="w-48 pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const query = (e.target as HTMLInputElement).value;
                    if (query)
                      window.location.href = `/search?q=${encodeURIComponent(query)}`;
                  }
                }}
              />
            </div>

            {/* Strong CTA – APPLY */}
            <Link
              href="/apply"
              className="inline-flex items-center justify-center rounded-full bg-brand-orange-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-orange-700 transition"
              aria-label="Apply for training or refer someone"
            >
              Apply Now
            </Link>
          </nav>

          {/* Mobile menu button and quick actions */}
          <div className="flex items-center gap-2 md:hidden">
            <Link
              href="/apply"
              className="rounded-full bg-brand-orange-500 px-3 py-2.5 text-[11px] font-semibold hover:bg-brand-orange-600 transition-colors"
              style={{ color: '#FFFFFF' }}
            >
              Apply
            </Link>
            <PremiumMobileNav />
          </div>
        </div>
      </header>

      {/* Mobile menu overlay and drawer */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 z-50 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer */}
          <div
            className="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-white z-50 md:hidden overflow-y-auto shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation menu"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-orange-500 text-white text-xs font-black uppercase">
                    EFH
                  </div>
                  <span className="text-sm font-semibold text-black">
                    Menu
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-black hover:text-brand-orange-600 transition touch-manipulation"
                  aria-label="Close navigation menu"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Navigation Links */}
              <nav
                className="flex-1 p-6 space-y-2 overflow-y-auto"
                role="navigation"
                aria-label="Mobile navigation"
              >
                {/* Programs Section */}
                <div className="space-y-1">
                  <button
                    onClick={() => setMobileProgramsOpen(!mobileProgramsOpen)}
                    className="w-full flex items-center justify-between py-3 px-4 rounded-lg text-sm font-medium text-black hover:bg-slate-50 transition touch-manipulation"
                  >
                    <span>Programs</span>
                    <ChevronDown
                      size={16}
                      className={clsx(
                        'transition-transform',
                        mobileProgramsOpen && 'rotate-180'
                      )}
                    />
                  </button>
                  {mobileProgramsOpen && (
                    <div className="pl-4 space-y-1">
                      {programsLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className={clsx(
                            'block py-2 px-4 rounded-lg text-sm transition touch-manipulation',
                            pathname === link.href
                              ? 'bg-red-50 text-brand-orange-600 font-medium'
                              : 'text-black hover:bg-slate-50'
                          )}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Micro Classes Section */}
                <div className="space-y-1">
                  <button
                    onClick={() =>
                      setMobileMicroClassesOpen(!mobileMicroClassesOpen)
                    }
                    className="w-full flex items-center justify-between py-3 px-4 rounded-lg text-sm font-medium text-black hover:bg-slate-50 transition touch-manipulation"
                  >
                    <span>Micro Classes</span>
                    <ChevronDown
                      size={16}
                      className={clsx(
                        'transition-transform',
                        mobileMicroClassesOpen && 'rotate-180'
                      )}
                    />
                  </button>
                  {mobileMicroClassesOpen && (
                    <div className="pl-4 space-y-1">
                      {microClassesLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className={clsx(
                            'block py-2 px-4 rounded-lg text-sm transition touch-manipulation',
                            pathname === link.href
                              ? 'bg-red-50 text-brand-orange-600 font-medium'
                              : 'text-black hover:bg-slate-50'
                          )}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Funding Section */}
                <div className="space-y-1">
                  <button
                    onClick={() => setMobileFundingOpen(!mobileFundingOpen)}
                    className="w-full flex items-center justify-between py-3 px-4 rounded-lg text-sm font-medium text-black hover:bg-slate-50 transition touch-manipulation"
                  >
                    <span>Funding</span>
                    <ChevronDown
                      size={16}
                      className={clsx(
                        'transition-transform',
                        mobileFundingOpen && 'rotate-180'
                      )}
                    />
                  </button>
                  {mobileFundingOpen && (
                    <div className="pl-4 space-y-1">
                      {fundingLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className={clsx(
                            'block py-2 px-4 rounded-lg text-sm transition touch-manipulation',
                            pathname === link.href
                              ? 'bg-red-50 text-brand-orange-600 font-medium'
                              : 'text-black hover:bg-slate-50'
                          )}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Main Links */}
                {mainLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    {...(link.external
                      ? { target: '_blank', rel: 'noopener noreferrer' }
                      : {})}
                    className={clsx(
                      'block py-3 px-4 rounded-lg text-sm font-medium transition touch-manipulation',
                      pathname?.startsWith(link.href)
                        ? 'bg-red-50 text-brand-orange-600 border border-red-200'
                        : 'text-black hover:bg-slate-50 hover:text-black'
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              {/* Bottom Actions */}
              <div className="p-6 border-t border-slate-200 space-y-3">
                <Link
                  href={STUDENT_PORTAL_URL}
                  className="block py-3 px-4 text-center border-2 border-emerald-500 text-brand-orange-600 rounded-lg font-semibold hover:bg-red-50 transition touch-manipulation"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Student Portal
                </Link>
                <Link
                  href="/apply"
                  className="block py-3 px-4 text-center bg-brand-orange-500 text-white rounded-lg font-semibold hover:bg-brand-orange-600 transition shadow-lg touch-manipulation"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Apply / Refer Now
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
