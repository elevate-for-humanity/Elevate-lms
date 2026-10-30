import { PlatformShell } from '@/components/platform/PlatformShell';
import type { Metadata } from 'next';
import { EmailWorkspace } from '@/components/communications/EmailWorkspace';
import { requireRole } from '@/lib/auth/require-role';
import { HOST_SHOP_ROLES } from '@/lib/rbac/role-matrix';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Host Shop Email',
  robots: { index: false, follow: false },
};

export default async function HostShopEmailPage() {
  const { user, profile } = await requireRole(HOST_SHOP_ROLES);
  return (
    <PlatformShell
      user={{ id: user.id, email: user.email || '', full_name: profile?.full_name || undefined }}
      role="host_shop"
    >
      <main className="space-y-5 bg-slate-50 p-4 sm:p-6">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-fuchsia-700">
            Host Shop Communications
          </p>
          <h1 className="mt-1 text-3xl font-black text-slate-950">Host Shop Email</h1>
          <p className="mt-2 text-sm font-medium text-slate-600">
            Use your approved shop address for apprenticeship communication.
          </p>
        </div>
        <EmailWorkspace roleLabel="Host Shop" />
      </main>
    </PlatformShell>
  );
}
