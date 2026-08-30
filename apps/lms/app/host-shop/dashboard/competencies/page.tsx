import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { requireRole } from '@/lib/auth/require-role';
import { getHostShopBoard } from '@/lib/partner/board';
import { HOST_SHOP_ROLES } from '@/lib/rbac/role-matrix';
import CompetencyManager from './CompetencyManager.client';

export const metadata: Metadata = {
  title: 'Appendix A Competency Sign-Offs | Host Shop',
  description: 'Verify DOL Registered Apprenticeship Appendix A competencies for assigned apprentices.',
};

export const dynamic = 'force-dynamic';

export default async function HostShopCompetenciesPage() {
  const { user } = await requireRole(HOST_SHOP_ROLES);
  const board = await getHostShopBoard(user.id);

  if (board.unconfiguredPrograms.length > 0) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <section className="rounded-3xl border border-amber-300 bg-amber-50 p-7 text-amber-950 shadow-sm">
          <ShieldAlert className="h-9 w-9" />
          <p className="mt-5 text-xs font-black uppercase tracking-[0.14em]">{board.partner?.name || 'Host Shop'}</p>
          <h1 className="mt-2 text-3xl font-black">Competency sign-offs are blocked</h1>
          <p className="mt-3 leading-7">The active placements use {board.unconfiguredPrograms.map((program) => program.programSlug || 'an unconfigured occupation').join(', ')}, but no active approved registered-program standard is present. The portal will not invent Appendix A competencies or permit sign-offs until that standard is configured.</p>
          <p className="mt-3 text-sm font-semibold">Active placements remain visible in the Apprentices and Work Hours tabs as operational records.</p>
          <Link href="/host-shop/dashboard" className="mt-6 inline-flex rounded-xl bg-amber-900 px-5 py-3 text-sm font-black text-white">Back to dashboard</Link>
        </section>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <CompetencyManager />
      </div>
    </div>
  );
}
