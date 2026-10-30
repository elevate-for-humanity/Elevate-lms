'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { AdminNavShell } from '@/components/admin/AdminNavShell';
import { AdminMobileDock } from '@/components/admin/AdminMobileDock';
import { CommunicationTodos } from '@/components/communications/CommunicationTodos';
import type { NavSection } from '@/lib/admin/nav-config';

export function AdminApplicationChrome({
  children,
  navSections,
}: {
  children: React.ReactNode;
  navSections: NavSection[];
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Embedded tools retain their server authentication; only duplicate chrome is omitted.
  if (searchParams.get('embedded') === 'studio') {
    return <div data-elevate-embedded-tool className="min-h-dvh min-w-0 bg-white">{children}</div>;
  }
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
          ? 'fixed inset-0 z-40 flex h-dvh min-w-0 flex-col overflow-hidden bg-white'
          : 'min-h-dvh min-w-0 overflow-x-clip bg-slate-50'
      }
    >
      {/* Studio keeps these live notices inside its own navigation so they do
          not subtract height from the full-viewport conversation workspace. */}
      {!studioOwnsViewport ? <CommunicationTodos inboxPath="/phone/email" /> : null}
      {!studioOwnsViewport ? <AdminNavShell navSections={navSections} /> : null}
      <main
        data-elevate-dashboard-content
        className={
          studioOwnsViewport
            ? 'admin-studio-viewport min-h-0 min-w-0 flex-1 overflow-hidden'
            : 'min-w-0 overflow-x-clip pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0'
        }
      >
        {children}
      </main>
      {!studioOwnsViewport ? <AdminMobileDock /> : null}
    </div>
  );
}
