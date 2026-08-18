// Server Component - NO 'use client'
// This header renders on the server and is visible even with JS disabled.
// Marketing has exactly one header owner: apps/marketing/app/layout.tsx.

import Link from 'next/link';
import LogoImage from '@/components/site/LogoImage';
import HeaderMobileMenu from './HeaderMobileMenu.client';
import HeaderDesktopNav from './HeaderDesktopNav';
import { NAV_ITEMS } from '@/lib/navigation';
import { ROUTES } from '@/lib/navigation/routes';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export default function Header() {
  return (
    <header
      className="relative z-[100] isolate h-[68px] overflow-visible border-b border-slate-200 bg-white shadow-sm"
      role="banner"
      data-site-header
      data-header-owner="marketing-root"
    >
      <div className="mx-auto grid h-full w-full max-w-screen-2xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-3 xl:gap-3 xl:px-4 2xl:px-6">
        <Link
          href="/"
          className="flex min-w-0 flex-shrink-0 items-center gap-2"
          aria-label={`${PLATFORM_DEFAULTS.orgName} home`}
        >
          <LogoImage alt="Elevate" width={44} height={56} className="h-10 w-auto" />
          <span className="hidden whitespace-nowrap text-sm font-extrabold tracking-tight text-slate-950 2xl:inline">
            Elevate
          </span>
        </Link>

        {/* Keep compact laptop/tablet widths on the drawer navigation. The
            complete desktop nav only renders when there is enough horizontal
            space for every primary destination plus account actions. */}
        <div className="hidden min-w-0 justify-center overflow-visible 2xl:flex">
          <HeaderDesktopNav items={NAV_ITEMS} />
        </div>

        <div className="flex min-w-0 flex-shrink-0 flex-nowrap items-center justify-end gap-1.5">
          <div className="hidden flex-nowrap items-center gap-1 2xl:flex">
            <Link
              href={ROUTES.login}
              className="inline-flex whitespace-nowrap px-1.5 py-2 text-[13px] font-semibold text-slate-800 hover:text-slate-950 xl:px-2 xl:text-sm"
            >
              Sign In
            </Link>
            <Link
              href={ROUTES.apply}
              className="inline-flex whitespace-nowrap rounded-lg bg-brand-red-600 px-2.5 py-2 text-[13px] font-bold text-white hover:bg-brand-red-700 xl:px-3 xl:text-sm"
            >
              Apply
            </Link>
          </div>

          {/* Phones, tablets, and compact laptops use the dedicated drawer so
              Programs and every other navigation group remain reachable. */}
          <div className="flex flex-nowrap items-center gap-1 2xl:hidden">
            <span className="hidden whitespace-nowrap text-sm font-bold text-slate-700 sm:inline" aria-hidden="true">
              Menu
            </span>
            <HeaderMobileMenu items={NAV_ITEMS} />
          </div>
        </div>
      </div>
    </header>
  );
}
