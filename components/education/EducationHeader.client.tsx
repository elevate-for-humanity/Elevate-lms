'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const NAV = [
  { label: 'Programs', href: '/programs' },
  { label: 'Healthcare', href: '/programs/healthcare' },
  { label: 'Skilled Trades', href: '/programs/skilled-trades' },
  { label: 'Technology', href: '/programs/technology' },
  { label: 'CDL', href: '/programs/cdl-training' },
  { label: 'Funding', href: '/funding' },
  { label: 'Locations', href: '/locations' },
];

export function EducationHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-[9999] h-[60px] bg-white border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full">
        <div className="flex items-center justify-between h-full">
          <Link href="/education" className="flex items-center gap-2.5">
            <Logo alt={PLATFORM_DEFAULTS.orgName} width={140} height={40} className="h-9 w-auto" priority />
            <span className="hidden sm:inline text-xs font-bold text-brand-red-600 bg-brand-red-50 px-2.5 py-1 rounded-full border border-brand-red-200">
              Education
            </span>
          </Link>
          <nav className="hidden lg:flex items-center gap-1">
            {NAV.filter(Boolean).map((n) => n.href && (
              <Link
                key={n.label}
                href={n.href}
                className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-brand-red-600 hover:bg-white rounded-lg transition-colors"
              >
                {n.label}
              </Link>
            ))}
            <Link
              href="/apply"
              className="ml-1 px-5 py-2.5 text-sm font-bold bg-brand-red-600 hover:bg-brand-red-700 text-white rounded-lg transition-colors"
            >
              Apply
            </Link>
            <Link
              href="/login"
              className="ml-1 px-4 py-2.5 text-sm font-semibold text-brand-blue-600 border border-brand-blue-200 hover:bg-brand-blue-50 rounded-lg transition-colors"
            >
              Sign In
            </Link>
          </nav>
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-white"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        {mobileOpen && (
          <div className="lg:hidden border-t py-3 space-y-1">
            {NAV.filter(Boolean).map((n) => n.href && (
              <Link
                key={n.label}
                href={n.href}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-white rounded-lg"
              >
                {n.label}
              </Link>
            ))}
            <Link
              href="/apply"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2.5 text-sm font-bold text-brand-red-600"
            >
              Apply
            </Link>
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2.5 text-sm font-semibold text-brand-blue-600"
            >
              Sign In
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
