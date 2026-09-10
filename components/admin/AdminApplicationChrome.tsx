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
  const authOwnsViewport = pathname === '/login' || pathname.startsWith('/login/');
  const pageOwnsViewport = studioOwnsViewport || authOwnsViewport;

  return (
    <div
      className={
        pageOwnsViewport
          ? `h-dvh min-w-0 overflow-${studioOwnsViewport ? 'hidden bg-slate-950' : 'auto bg-slate-950'}`
          : 'min-h-dvh min-w-0 overflow-x-clip bg-slate-50'
      }
    >
      {!pageOwnsViewport ? <AdminNavShell navSections={navSections} /> : null}
      <div className={studioOwnsViewport ? 'h-full min-w-0 overflow-hidden' : 'min-w-0 overflow-x-clip'}>
        {children}
      </div>
    </div>
  );
}
