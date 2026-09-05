import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth/require-role';
import { hasAnyRole } from '@/lib/rbac/role-matrix';

export const metadata: Metadata = {
  title: 'Apprenticeship Compliance Portal',
  description: 'Secure routing for apprenticeship competency and completion records.',
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = 'force-dynamic';

const COMPLIANCE_ROLES = [
  'super_admin',
  'admin',
  'org_admin',
  'staff',
  'instructor',
  'program_holder',
  'partner',
  'host_shop',
  'host_shop_admin',
  'employer',
  'sponsor',
  'student',
  'learner',
  'apprentice',
  'barber_apprentice',
  'cosmetology_apprentice',
] as const;

export default async function ApprenticeshipComplianceRouter() {
  const { effectiveRoles } = await requireRole(COMPLIANCE_ROLES);

  if (
    hasAnyRole(
      effectiveRoles,
      ['super_admin', 'admin', 'org_admin', 'staff', 'instructor', 'program_holder'],
      { adminOverride: true },
    )
  ) {
    redirect('/program-holder/compliance');
  }

  if (
    hasAnyRole(
      effectiveRoles,
      ['partner', 'host_shop', 'host_shop_admin', 'employer', 'sponsor'],
      { adminOverride: false },
    )
  ) {
    redirect('/host-shop/dashboard/competencies');
  }

  redirect('/apprentice/competencies');
}
