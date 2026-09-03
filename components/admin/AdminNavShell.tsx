'use client';

/**
 * AdminNavShell
 *
 * Renders AdminNav immediately with the nav structure (from server props),
 * then fetches notification counts + user name from /api/admin/header-data
 * asynchronously. The nav bar is visible instantly — the bell badge and
 * greeting populate within ~200ms without blocking the page render.
 */

import { useEffect, useState } from 'react';
import AdminNav, { type AdminNavNotif } from '@/components/admin/AdminNav';
import { type NavSection } from '@/lib/admin/nav-config';

interface AdminNavShellProps {
  /** Nav sections from DB — passed from server layout, no client fetch needed. */
  navSections: NavSection[];
}

export function AdminNavShell({ navSections }: AdminNavShellProps) {
  const [userName, setUserName] = useState('Admin');
  const [notifs, setNotifs] = useState<AdminNavNotif[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/header-data', { credentials: 'same-origin' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (cancelled || !data) return;
        setUserName(data.userName ?? 'Admin');
        setNotifs(data.notifs ?? []);
      })
      .catch(() => {/* non-critical — defaults are fine */});
    return () => { cancelled = true; };
  }, []);

  return <AdminNav userName={userName} notifs={notifs} navSections={navSections} />;
}
