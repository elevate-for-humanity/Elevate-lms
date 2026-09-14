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
      data-elevate-dashboard-shell={studioOwnsViewport ? 'studio' : 'admin'}
      className={
        studioOwnsViewport
          ? 'h-dvh min-w-0 overflow-hidden bg-slate-950'
          : 'min-h-dvh min-w-0 overflow-x-clip bg-slate-50'
      }
    >
      {!studioOwnsViewport ? <AdminNavShell navSections={navSections} /> : null}
      <main
        data-elevate-dashboard-content
        className={
          studioOwnsViewport
            ? 'admin-studio-viewport h-full min-w-0 overflow-hidden'
            : 'min-w-0 overflow-x-clip'
        }
      >
        {children}
      </main>
    </div>
  );
}
