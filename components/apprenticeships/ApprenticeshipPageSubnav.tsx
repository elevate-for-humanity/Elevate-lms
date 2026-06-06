'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { label: 'Overview', hash: '#overview' },
  { label: 'Programs', hash: '#pathways' },
  { label: 'For learners', hash: '#learners' },
  { label: 'For employers', hash: '#employers' },
  { label: 'Host shops', href: '/programs/barber-apprenticeship/host-shops' },
  { label: 'Apply', href: '/apply' },
] as const;

export function ApprenticeshipPageSubnav() {
  const pathname = usePathname();
  if (pathname !== '/apprenticeships') return null;

  return (
    <nav
      className="sticky top-[60px] z-40 bg-white border-b border-slate-200 shadow-sm"
      aria-label="Apprenticeship sections"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <ul className="flex gap-1 overflow-x-auto py-2 scrollbar-none -mx-1">
          {LINKS.map((link) => {
            const href = 'href' in link ? link.href : `/apprenticeships${link.hash}`;
            return (
              <li key={link.label} className="shrink-0">
                <Link
                  href={href}
                  className="block whitespace-nowrap rounded-lg px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand-red-600 transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
