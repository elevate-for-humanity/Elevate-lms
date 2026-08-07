// Server Component - NO 'use client'
// This header renders on the server and is visible even with JS disabled

import Link from 'next/link';
import LogoImage from '@/components/site/LogoImage';
import { ALL_PROGRAMS } from '@/data/programs/catalog';
import HeaderMobileMenu from './HeaderMobileMenu.client';
import HeaderDesktopNav from './HeaderDesktopNav';
import { NAV_ITEMS } from '@/lib/navigation';
import { ROUTES } from '@/lib/navigation/routes';
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
      className="fixed top-0 left-0 right-0 h-[60px] bg-white/95 backdrop-blur-md z-[9999] shadow-sm border-b border-slate-100 transition-all duration-200"
      role="banner"
    >
      <div className="max-w-screen-2xl mx-auto w-full h-full px-3 sm:px-4 xl:px-8 grid grid-cols-[auto_1fr_auto] items-center gap-2 xl:gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 flex-shrink-0 min-w-0"
          aria-label={`${PLATFORM_DEFAULTS.orgName} home`}
        >
          <LogoImage alt="Elevate" width={40} height={60} className="w-auto h-9" priority />
          <span className="font-bold text-[15px] text-slate-900 tracking-tight truncate whitespace-nowrap">
            Elevate
          </span>
        </Link>

        {/* Use the desktop navigation only when there is enough horizontal room.
            At md/tablet widths the previous layout compressed the center column
            between the brand and CTA controls, which could make the nav appear blank. */}
        <div className="hidden lg:flex justify-center min-w-0 overflow-visible">
          <HeaderDesktopNav items={NAV_ITEMS} />
        </div>

        <div className="flex flex-row flex-nowrap items-center justify-end gap-0.5 lg:gap-1 flex-shrink-0 min-w-0">
          <div className="hidden lg:flex items-center gap-2 mr-2">
            <Link
              href={ROUTES.login}
              className="text-sm text-slate-600 hover:text-slate-900 px-3 py-2"
            >
              Sign In
            </Link>
            <Link
              href={ROUTES.apply}
              className="text-sm bg-brand-red-600 hover:bg-brand-red-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              Apply
            </Link>
          </div>
          <span className="lg:hidden">
            <HeaderMobileMenu items={NAV_ITEMS} programApplyLinks={PROGRAM_APPLY_LINKS} />
          </span>
        </div>
      </div>
    </header>
  );
}
