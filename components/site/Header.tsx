// Server Component - NO 'use client'
// This header renders on the server and is visible even with JS disabled

import Link from 'next/link';
import LogoImage from '@/components/site/LogoImage';
import { ALL_PROGRAMS } from '@/data/programs/catalog';
import HeaderMobileMenu from './HeaderMobileMenu.client';
import HeaderDesktopNav from './HeaderDesktopNav';
import SearchModal from './SearchModal.client';
import LanguageSwitcher from './LanguageSwitcher.client';
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
      <div className="max-w-screen-2xl mx-auto w-full h-full px-4 lg:px-8 grid grid-cols-[auto_1fr_auto] items-center gap-2 lg:gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 flex-shrink-0 min-w-0"
          aria-label={`${PLATFORM_DEFAULTS.orgName} home`}
        >
          <LogoImage alt="Elevate" width={40} height={60} className="w-auto h-9" priority />
          <span className="font-bold text-[15px] text-slate-900 hidden sm:block tracking-tight truncate">
            Elevate
          </span>
        </Link>

        <div className="hidden lg:flex justify-center min-w-0 overflow-x-auto overflow-y-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <HeaderDesktopNav items={NAV_ITEMS} />
        </div>

        <div className="flex flex-row flex-nowrap items-center justify-end gap-0.5 sm:gap-1 flex-shrink-0 min-w-0">
          <div className="hidden lg:flex flex-row flex-nowrap items-center gap-1.5">
            <SearchModal />
            <LanguageSwitcher compact={true} />
            <Link
              href="/login"
              prefetch={false}
              className="text-slate-600 font-semibold text-[13px] hover:text-slate-900 transition-colors px-2.5 py-1.5 rounded-md hover:bg-slate-50 whitespace-nowrap"
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
