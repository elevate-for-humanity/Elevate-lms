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
import { withPortalNavigation, isNavSections, type NavSection } from '@/lib/admin/nav-config';

interface AdminNavShellProps {
  /** Nav sections from DB — passed from server layout, no client fetch needed. */
  navSections: NavSection[];
}

export function AdminNavShell({ navSections }: AdminNavShellProps) {
  const [userName, setUserName] = useState('Admin');
  const [notifs, setNotifs] = useState<AdminNavNotif[]>([]);
  const [headerStatus, setHeaderStatus] = useState<'loading' | 'ok' | 'degraded' | 'unavailable'>('loading');
  const [headerRetry, setHeaderRetry] = useState(0);
  const [resolvedNavSections, setResolvedNavSections] = useState(() => withPortalNavigation(navSections));

  useEffect(() => {
    let cancelled = false;
    setHeaderStatus('loading');
    fetch('/api/admin/header-data', { credentials: 'same-origin' })
      .then(r => { if (!r.ok) throw new Error('Header data unavailable'); return r.json(); })
      .then(data => {
        if (cancelled) return;
        if (!data || !Array.isArray(data.notifs)) throw new Error('Header data invalid');
        setUserName(data.userName ?? 'Admin');
        setNotifs(data.notifs);
        setHeaderStatus(data.status === 'degraded' ? 'degraded' : 'ok');
      })
      .catch(() => { if (!cancelled) setHeaderStatus('unavailable'); });

    fetch('/api/admin/nav-config', { credentials: 'same-origin' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (cancelled || !isNavSections(data?.sections)) return;
        setResolvedNavSections(withPortalNavigation(data.sections));
      })
      .catch(() => {/* non-critical — server-provided defaults remain available */});
    return () => { cancelled = true; };
  }, [headerRetry]);

  return <>
    <AdminNav userName={userName} notifs={notifs} navSections={resolvedNavSections} />
    {(headerStatus === 'degraded' || headerStatus === 'unavailable') && (
      <div role="status" className="flex flex-wrap items-center gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
        <span>{headerStatus === 'degraded' ? 'Notification counts are incomplete.' : 'Notification counts could not load.'}</span>
        <button type="button" className="min-h-11 rounded-md px-3 font-semibold underline" onClick={() => setHeaderRetry(value => value + 1)}>Retry notifications</button>
      </div>
    )}
  </>;
}
