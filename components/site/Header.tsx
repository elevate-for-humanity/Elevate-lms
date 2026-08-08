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
      className="fixed inset-x-0 top-0 z-[9999] h-[68px] border-b border-slate-200 bg-white shadow-sm"
      role="banner"
    >
      <div className="mx-auto grid h-full w-full max-w-screen-2xl grid-cols-[auto_1fr_auto] items-center gap-2 px-3 md:gap-4 md:px-4 xl:gap-6 xl:px-8">
        <Link
          href="/"
          className="flex min-w-0 flex-shrink-0 items-center gap-2.5"
          aria-label={`${PLATFORM_DEFAULTS.orgName} home`}
        >
          <LogoImage alt="Elevate" width={44} height={56} className="h-10 w-auto" />
          <span className="hidden whitespace-nowrap text-base font-extrabold tracking-tight text-slate-950 sm:inline">
            Elevate
          </span>
        </Link>

        {/* Desktop keeps the horizontal navigation and also exposes the full hamburger menu. */}
        <div className="hidden min-w-0 justify-center overflow-visible lg:flex">
          <HeaderDesktopNav items={NAV_ITEMS} />
        </div>

        <div className="flex min-w-0 flex-shrink-0 items-center justify-end gap-2">
          <div className="hidden items-center gap-1 lg:flex xl:gap-2">
            <HeaderDesktopMenu items={NAV_ITEMS} />
            <Link
              href={ROUTES.login}
              className="whitespace-nowrap px-2 py-2 text-sm font-semibold text-slate-800 hover:text-slate-950 xl:px-3 xl:text-base"
            >
              Sign In
            </Link>
            <Link
              href={ROUTES.apply}
              className="whitespace-nowrap rounded-lg bg-brand-red-600 px-3 py-2 text-sm font-bold text-white hover:bg-brand-red-700 xl:px-5 xl:py-2.5 xl:text-base"
            >
              Apply
            </Link>
          </div>

          <div className="flex items-center gap-1 lg:hidden">
            <span className="hidden text-sm font-bold text-slate-700 sm:inline" aria-hidden="true">
              Menu
            </span>
            <HeaderMobileMenu items={NAV_ITEMS} />
          </div>
        </div>
      </div>
    </header>
  );
}
