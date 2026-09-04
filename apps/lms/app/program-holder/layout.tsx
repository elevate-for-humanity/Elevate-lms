import type { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { PROGRAM_HOLDER_ROLES } from '@/lib/rbac/role-matrix';

export const metadata: Metadata = {
  title: { default: 'Program Holder Portal', template: '%s | Elevate Program Holder' },
  description: 'Manage approved programs, students, documents, training hours, and compliance actions.',
  manifest: '/manifest-program-holder.json',
  robots: { index: false, follow: false },
  appleWebApp: {
    capable: true,
    title: 'Elevate Program Holder',
    statusBarStyle: 'black-translucent',
  },
};

export const dynamic = 'force-dynamic';

export default async function ProgramHolderPortalLayout({ children }: { children: React.ReactNode }) {
  // Protect every Program Holder route, including pages that do not perform
  // their own data lookup. Page-level guards remain defense in depth.
  await requireRole(PROGRAM_HOLDER_ROLES);

  return children;
}
