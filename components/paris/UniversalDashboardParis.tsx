'use client';

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
  const portal = PORTALS.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  const learner =
    pathname === '/lms' ||
    pathname.startsWith('/lms/') ||
    pathname === '/learner' ||
    pathname.startsWith('/learner/');

  if (portal) {
    return <ParisFloatingWrapper surface="portal" portalRole={portal.role} autoOpenOnDashboard />;
  }
  if (learner) {
    return <ParisFloatingWrapper surface="learner" portalRole="Learner" />;
  }
  return null;
}
