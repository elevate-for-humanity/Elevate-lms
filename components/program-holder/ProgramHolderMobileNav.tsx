'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export function ProgramHolderMobileNav({ links }: { links: readonly (readonly [string, string])[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="program-holder-mobile-navigation"
        onClick={() => setOpen((value) => !value)}
        className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-bold text-slate-800"
      >
        {open ? 'Close menu' : 'Menu'}
      </button>
      {open && (
        <div id="program-holder-mobile-navigation" className="absolute inset-x-0 top-full max-h-[min(75dvh,36rem)] overflow-y-auto border-b border-slate-200 bg-white p-3 shadow-lg">
          <div className="grid grid-cols-2 gap-2">
            {links.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                aria-current={pathname === href ? 'page' : undefined}
                onClick={() => setOpen(false)}
                className="flex min-h-11 items-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-800 aria-[current=page]:border-blue-700 aria-[current=page]:bg-blue-50"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
