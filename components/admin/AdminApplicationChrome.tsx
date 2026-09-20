'use client';

import { usePathname } from 'next/navigation';
import { AdminNavShell } from '@/components/admin/AdminNavShell';
import { AdminMobileDock } from '@/components/admin/AdminMobileDock';
import type { NavSection } from '@/lib/admin/nav-config';

export function AdminApplicationChrome({
  children,
  navSections,
}: {
  children: React.ReactNode;
  navSections: NavSection[];
}) {
  const pathname = usePathname();
  // Only the conversation workspace owns the viewport. Tool pages such as
  // Course Builder are ordinary documents and must retain the Admin header and
  // browser scrolling.
  const studioOwnsViewport = pathname === '/studio';

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
            ? 'admin-studio-viewport h-[calc(100dvh-4rem)] min-w-0 overflow-hidden lg:h-full'
            : 'min-w-0 overflow-x-clip pb-16 lg:pb-0'
        }
      >
        {children}
      </main>
      <AdminMobileDock />
    </div>
  );
}
