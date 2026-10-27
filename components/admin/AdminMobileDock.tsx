'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bot, GraduationCap, Home, KeyRound, Users } from 'lucide-react';

const ITEMS = [
  { label: 'Home', href: '/dashboard', icon: Home },
  { label: 'Students', href: '/students', icon: Users },
  { label: 'Courses', href: '/studio/courses', icon: GraduationCap },
  { label: 'Studio', href: '/studio', icon: Bot },
  { label: 'Grok', href: '/settings/grok', icon: KeyRound },
] as const;

function active(pathname: string, href: string) {
  if (href === '/dashboard') return pathname === href;
  if (href === '/studio') return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminMobileDock() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile admin navigation"
      className="fixed inset-x-0 bottom-0 z-[70] border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(15,23,42,0.12)] backdrop-blur lg:hidden"
    >
      <div className="grid min-h-16 grid-cols-5">
        {ITEMS.map(({ label, href, icon: Icon }) => {
          const selected = active(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={selected ? 'page' : undefined}
              className={`flex min-w-0 flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-bold ${selected ? 'text-brand-red-700' : 'text-slate-600'}`}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
