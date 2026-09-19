'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ParisFloatingWrapper } from './ParisFloatingWrapper';

const PORTALS = [
  { prefix: '/program-holder', role: 'Program Holder' },
  { prefix: '/host-shop', role: 'Host Shop' },
  { prefix: '/employer', role: 'Employer' },
  { prefix: '/apprentice', role: 'Apprentice' },
  { prefix: '/workforce', role: 'Workforce Partner' },
  { prefix: '/creator', role: 'Course Creator' },
  { prefix: '/account', role: 'Account' },
] as const;

export function UniversalDashboardParis() {
  const pathname = usePathname();
  const [personName, setPersonName] = useState<string | null>(null);
  useEffect(() => {
    if (!pathname.startsWith('/program-holder') && !pathname.startsWith('/host-shop')) return;
    const controller = new AbortController();
    void fetch('/api/auth/me', { credentials: 'same-origin', signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((body) => setPersonName(body?.profile?.full_name || body?.user?.full_name || body?.user?.name || null))
      .catch(() => undefined);
    return () => controller.abort();
  }, [pathname]);
  const portal = PORTALS.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  const learner =
    pathname === '/lms' ||
    pathname.startsWith('/lms/') ||
    pathname === '/learner' ||
    pathname.startsWith('/learner/');

  if (portal) {
    return <ParisFloatingWrapper surface="portal" portalRole={portal.role} personName={personName} autoOpenOnDashboard />;
  }
  if (learner) {
    return <ParisFloatingWrapper surface="learner" portalRole="Learner" />;
  }
  return null;
}
