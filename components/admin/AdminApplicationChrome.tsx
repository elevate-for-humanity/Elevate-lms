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
  // Sign-in and account recovery are public forms, not dashboard documents.
  // Fixed dashboard navigation can cover their fields when a mobile keyboard opens.
  if (pathname === '/login' || pathname.startsWith('/auth/')) {
    return <div data-elevate-auth-shell className="min-h-dvh min-w-0 bg-slate-950">{children}</div>;
  }
  // Only the conversation workspace owns the viewport. Tool pages such as
  // Course Builder are ordinary documents and must retain the Admin header and
  // browser scrolling.
  const studioOwnsViewport = pathname === '/studio' || pathname === '/studio/browser';

  return (
    <div
      data-elevate-dashboard-shell={studioOwnsViewport ? 'studio' : 'admin'}
      className={
        studioOwnsViewport
          ? 'h-dvh min-w-0 overflow-hidden bg-white'
          : 'min-h-dvh min-w-0 overflow-x-clip bg-slate-50'
      }
    >
      {!studioOwnsViewport ? <AdminNavShell navSections={navSections} /> : null}
      <main
        data-elevate-dashboard-content
        className={
          studioOwnsViewport
            ? 'admin-studio-viewport h-full min-w-0 overflow-hidden'
            : 'min-w-0 overflow-x-clip pb-16 lg:pb-0'
        }
      >
        {children}
      </main>
      {!studioOwnsViewport ? <AdminMobileDock /> : null}
    </div>
  );
}
