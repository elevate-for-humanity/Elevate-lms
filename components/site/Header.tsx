// Server Component - NO 'use client'
// This header renders on the server and is visible even with JS disabled

import Link from 'next/link';
import LogoImage from '@/components/site/LogoImage';
import { ALL_PROGRAMS } from '@/data/programs/catalog';
import HeaderMobileMenu from './HeaderMobileMenu.client';
import HeaderDesktopNav from './HeaderDesktopNav';
import HeaderUtilities from './HeaderUtilities.client';
import { NAV_ITEMS } from '@/lib/navigation';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const PROGRAM_APPLY_LINKS = Object.fromEntries(
  ALL_PROGRAMS.filter((program) => Boolean(program.cta?.applyHref)).map((program) => [
    program.slug,
    program.cta.applyHref,
  ]),
);

export default function Header() {
  return (
    <header
      className="fixed top-0 left-0 right-0 h-[60px] bg-white z-[9999] shadow-sm border-b border-slate-100"
      role="banner"
    >
      <div className="max-w-screen-2xl mx-auto w-full h-full flex items-center justify-between px-4 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 flex-shrink-0"
          aria-label={`${PLATFORM_DEFAULTS.orgName} home`}
        >
          <LogoImage alt="Elevate" width={40} height={60} className="w-auto h-9" priority />
          <span className="font-bold text-[15px] text-slate-900 hidden sm:block tracking-tight">Elevate</span>
        </Link>

        <HeaderDesktopNav items={NAV_ITEMS} />

        <div className="flex items-center gap-1 shrink-0">
          <HeaderUtilities />

          <div className="hidden lg:flex items-center gap-1.5">
            <Link
              href="/login"
              prefetch={false}
              className="text-slate-600 font-semibold text-[13px] hover:text-slate-900 transition-colors px-2.5 py-1.5 rounded-md hover:bg-slate-50"
            >
              Sign In
            </Link>
            <Link
              href="/for-students"
              prefetch={false}
              className="bg-brand-red-600 text-white px-3.5 py-1.5 rounded-lg font-semibold text-[13px] hover:bg-brand-red-700 transition-colors whitespace-nowrap"
            >
              Get Started
            </Link>
          </div>

          <HeaderMobileMenu items={NAV_ITEMS} programApplyLinks={PROGRAM_APPLY_LINKS} />
        </div>
      </div>
    </header>
  );
}
