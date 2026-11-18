import { redirect } from 'next/navigation';
import { PORTAL_MAP } from '@/lib/routing/portal-map';

// Preserve the authenticated employer dashboard on its actual LMS host.
export default function LegacyEmployerPage() {
  const employer = PORTAL_MAP.employer;
  redirect(`${employer.host}${employer.defaultPath}`);
}
