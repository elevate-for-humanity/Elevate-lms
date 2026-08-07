// Server Component - NO 'use client'
// This header renders on the server and is visible even with JS disabled

import Link from 'next/link';
import LogoImage from '@/components/site/LogoImage';
import HeaderMobileMenu from './HeaderMobileMenu.client';
import HeaderDesktopMenu from './HeaderDesktopMenu.client';
import HeaderDesktopNav from './HeaderDesktopNav';
import { NAV_ITEMS } from '@/lib/navigation';
import { ROUTES } from '@/lib/navigation/routes';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export default function Header() {
  return (
    <header
      className="fixed top-0 left-0 right-0 h-[68px] bg-white z-[9999] shadow-sm border-b border-slate-200"
      role="banner"
    >
      <div className="max-w-screen-2xl mx-auto w-full h-full px-4 xl:px-8 grid grid-cols-[auto_1fr_auto] items-center gap-3 xl:gap-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 flex-shrink-0 min-w-0"
          aria-label={`${PLATFORM_DEFAULTS.orgName} home`}
        >
          <LogoImage alt="Elevate" width={44} height={56} className="w-auto h-10" />
          <span className="font-extrabold text-base text-slate-950 tracking-tight whitespace-nowrap">
            Elevate
          </span>
        </Link>

        <div className="hidden lg:flex justify-center min-w-0 overflow-visible">
          <HeaderDesktopNav items={NAV_ITEMS} />
        </div>

        <div className="flex items-center justify-end gap-2 flex-shrink-0 min-w-0">
          <div className="hidden lg:flex items-center gap-2">
            <Link
              href={ROUTES.login}
              className="text-base font-semibold text-slate-700 hover:text-slate-950 px-3 py-2"
            >
              Sign In
            </Link>
            <Link
              href={ROUTES.apply}
              className="text-base bg-brand-red-600 hover:bg-brand-red-700 text-white px-5 py-2.5 rounded-lg font-bold"
            >
              Apply
            </Link>
            <HeaderDesktopMenu items={NAV_ITEMS} />
          </div>

          <div className="lg:hidden flex items-center gap-1">
            <span className="hidden sm:inline text-sm font-bold text-slate-700" aria-hidden="true">
              Menu
            </span>
            <HeaderMobileMenu items={NAV_ITEMS} />
          </div>
        </div>
      </div>
    </header>
  );
}
