'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, ChevronDown } from 'lucide-react';

const NAV = [
  {
    label: 'Tax Services',
    href: '/supersonic-fast-cash/services',
    children: [
      { label: 'Tax Preparation', href: '/supersonic-fast-cash/services/tax-preparation', image: '/images/pages/supersonic-tax-prep.jpg', desc: 'PTIN-credentialed professional filing' },
      { label: 'Refund Advance', href: '/supersonic-fast-cash/services/refund-advance', image: '/images/pages/supersonic-page-2.jpg', desc: 'Up to $7,500 same day' },
      { label: 'DIY Tax Filing', href: '/supersonic-fast-cash/diy-taxes', image: '/images/pages/supersonic-page-3.jpg', desc: 'File online at your own pace' },
      { label: 'Audit Protection', href: '/supersonic-fast-cash/services/audit-protection', image: '/images/pages/supersonic-page-4.jpg', desc: 'Full IRS representation included' },
      { label: 'Bookkeeping', href: '/supersonic-fast-cash/services/bookkeeping', image: '/images/pages/finance-accounting.jpg', desc: 'Monthly small business bookkeeping' },
      { label: 'Payroll', href: '/supersonic-fast-cash/services/payroll', image: '/images/pages/supersonic-page-5.jpg', desc: 'Full-service payroll processing' },
    ],
  },
  {
    label: 'Free VITA Tax Help',
    href: '/tax/rise-up-foundation',
    children: [
      { label: 'Free Tax Preparation', href: '/tax/rise-up-foundation/free-tax-help', image: '/images/pages/subpage-tax-hero.jpg', desc: 'IRS-certified volunteers, no cost' },
      { label: 'VITA Site Locator', href: '/tax/rise-up-foundation/site-locator', image: '/images/pages/locations-page-1.jpg', desc: 'Find a free tax site near you' },
      { label: 'Eligibility & FAQ', href: '/tax/rise-up-foundation/faq', image: '/images/pages/faq-page-1.jpg', desc: 'Who qualifies for free filing' },
      { label: 'Volunteer', href: '/tax/rise-up-foundation/volunteer', image: '/images/pages/admin-tax-training-hero.jpg', desc: 'Become an IRS-certified volunteer' },
      { label: 'Required Documents', href: '/tax/rise-up-foundation/documents', image: '/images/pages/admin-documents-hero.jpg', desc: 'What to bring to your appointment' },
    ],
  },
  {
    label: 'Tools',
    href: '/supersonic-fast-cash/tax-tools',
    children: [
      { label: 'Refund Calculator', href: '/supersonic-fast-cash/calculator', image: '/images/pages/calculator-page-1.jpg', desc: 'Estimate your federal refund' },
      { label: 'Tax Tools', href: '/supersonic-fast-cash/tax-tools', image: '/images/pages/admin-tax-apps-hero.jpg', desc: 'Checklists, guides, and resources' },
      { label: 'Upload Documents', href: '/supersonic-fast-cash/upload-documents', image: '/images/pages/admin-documents-upload-hero.jpg', desc: 'Securely send your tax docs' },
      { label: 'Software Download', href: '/supersonic-fast-cash/tools/software-download', image: '/images/pages/admin-dev-hero.jpg', desc: 'Download our tax software' },
      { label: 'Refund Tracker', href: '/supersonic-fast-cash/tools/refund-tracker', image: '/images/pages/admin-tax-reports-hero.jpg', desc: 'Track your IRS refund status' },
    ],
  },
  {
    label: 'Service Areas',
    href: '/supersonic-fast-cash/locations',
    children: [
      { label: 'Indiana', href: '/supersonic-fast-cash/tax-preparation-indiana', image: '/images/pages/supersonic-page-10.jpg', desc: 'Indianapolis and statewide' },
      { label: 'Illinois', href: '/supersonic-fast-cash/tax-preparation-illinois', image: '/images/pages/supersonic-page-11.jpg', desc: 'Chicago metro and statewide' },
      { label: 'Ohio', href: '/supersonic-fast-cash/tax-preparation-ohio', image: '/images/pages/supersonic-page-12.jpg', desc: 'Columbus, Cleveland, Cincinnati' },
      { label: 'Tennessee', href: '/supersonic-fast-cash/tax-preparation-tennessee', image: '/images/pages/supersonic-fast-cash-page-1.jpg', desc: 'Nashville and statewide' },
      { label: 'Texas', href: '/supersonic-fast-cash/tax-preparation-texas', image: '/images/pages/supersonic-tax.jpg', desc: 'Dallas, Houston, and statewide' },
    ],
  },
  {
    label: 'Careers',
    href: '/supersonic-fast-cash/careers',
    children: [
      { label: 'Join Our Team', href: '/supersonic-fast-cash/careers', image: '/images/pages/supersonic-training-hero.jpg', desc: 'Open positions at Supersonic' },
      { label: 'Tax Preparer Training', href: '/supersonic-fast-cash/training', image: '/images/pages/admin-tax-training-hero.jpg', desc: 'Get PTIN-certified and start earning' },
      { label: 'Competency Test', href: '/supersonic-fast-cash/careers/competency-test', image: '/images/pages/competency-test-hero.jpg', desc: 'Assess your tax knowledge' },
      { label: 'Open a Sub-Office', href: '/supersonic-fast-cash/multi-site', image: '/images/pages/supersonic-page-6.jpg', desc: 'Franchise and sub-office opportunities' },
    ],
  },
];

export default function SupersonicNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [openMobileSection, setOpenMobileSection] = useState<string | null>(null);

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm" aria-label="Supersonic Fast Cash navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/supersonic-fast-cash" className="flex items-center gap-3 flex-shrink-0">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden">
              <Image
                src="/images/pages/supersonic-tax-prep.jpg"
                alt="Supersonic Fast Cash"
                fill
                className="object-cover"
                sizes="32px"
              />
            </div>
            <span className="font-black text-slate-900 text-lg hidden sm:block">
              Supersonic Fast Cash
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1">
            {NAV.map((item) => (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => setOpenDropdown(item.label)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <Link
                  href={item.href}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-semibold text-slate-700 hover:text-brand-red-600 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  {item.label}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openDropdown === item.label ? 'rotate-180' : ''}`} />
                </Link>

                {openDropdown === item.label && (
                  <div className="absolute top-full left-0 pt-1 z-50 min-w-[520px]">
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 grid grid-cols-2 gap-2">
                      {item.children.map((child) => (
                        <Link
                          key={child.label}
                          href={child.href}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                        >
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                            <Image
                              src={child.image}
                              alt={child.label}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900 group-hover:text-brand-red-600 transition-colors">
                              {child.label}
                            </p>
                            <p className="text-xs text-slate-500">{child.desc}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/supersonic-fast-cash/portal"
              className="text-sm font-semibold text-slate-700 hover:text-slate-900 px-3 py-2"
            >
              Client Portal
            </Link>
            <Link
              href="/supersonic-fast-cash/apply"
              className="px-5 py-2.5 bg-brand-red-600 text-white font-bold text-sm rounded-xl hover:bg-brand-red-700 transition-colors"
            >
              Get Refund Now
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-100 bg-white max-h-[80vh] overflow-y-auto">
          <div className="px-4 py-4 space-y-1">
            {NAV.map((item) => (
              <div key={item.label}>
                <button
                  onClick={() => setOpenMobileSection(openMobileSection === item.label ? null : item.label)}
                  className="flex items-center justify-between w-full px-3 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  {item.label}
                  <ChevronDown className={`w-4 h-4 transition-transform ${openMobileSection === item.label ? 'rotate-180' : ''}`} />
                </button>
                {openMobileSection === item.label && (
                  <div className="pl-4 pb-2 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.label}
                        href={child.href}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
                      >
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                          <Image src={child.image} alt={child.label} fill className="object-cover" sizes="40px" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{child.label}</p>
                          <p className="text-xs text-slate-500">{child.desc}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <Link
                href="/supersonic-fast-cash/portal"
                onClick={() => setMobileOpen(false)}
                className="block w-full text-center px-4 py-3 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
              >
                Client Portal
              </Link>
              <Link
                href="/supersonic-fast-cash/apply"
                onClick={() => setMobileOpen(false)}
                className="block w-full text-center px-4 py-3 bg-brand-red-600 text-white font-bold rounded-xl hover:bg-brand-red-700 transition-colors"
              >
                Get Refund Now
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
