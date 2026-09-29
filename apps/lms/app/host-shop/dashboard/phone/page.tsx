import type { Metadata } from 'next';
import { ProgramHolderPhone } from '@/components/program-holder/ProgramHolderPhone';
import { requireRole } from '@/lib/auth/require-role';
import { HOST_SHOP_ROLES } from '@/lib/rbac/role-matrix';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Phone | Host Shop',
  description: 'Answer Elevate calls, return PARIS callbacks, and manage Host Shop phone availability.',
  robots: { index: false, follow: false },
};

export default async function HostShopPhonePage() {
  await requireRole(HOST_SHOP_ROLES);
  return <ProgramHolderPhone roleLabel="Host Shop" />;
}
