'use client';

import { usePathname } from 'next/navigation';
import { AdminNavShell } from '@/components/admin/AdminNavShell';
import type { NavSection } from '@/lib/admin/nav-config';

export function AdminApplicationChrome({
  children,
  navSections,
}: {
  children: React.ReactNode;
  navSections: NavSection[];
}) {
  const pathname = usePathname();
  const studioOwnsViewport = pathname === '/studio' || pathname.startsWith('/studio/');

  return (
    <div
      className={
        studioOwnsViewport
          ? 'h-dvh min-w-0 overflow-hidden bg-slate-950'
          : 'min-h-dvh min-w-0 overflow-x-clip bg-slate-50'
      }
    >
      {!studioOwnsViewport ? <AdminNavShell navSections={navSections} /> : null}
      <main className={studioOwnsViewport ? 'h-full min-w-0 overflow-hidden' : 'min-w-0 overflow-x-clip'}>
        {children}
      </main>
    </div>
  );
}
