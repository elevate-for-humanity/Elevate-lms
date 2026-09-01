import type { Metadata } from 'next';
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

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {board.unconfiguredPrograms.length > 0 ? (
          <section className="mb-5 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950 shadow-sm">
          <ShieldAlert className="h-9 w-9" />
          <p className="mt-5 text-xs font-black uppercase tracking-[0.14em]">{board.partner?.name || 'Host Shop'}</p>
          <h1 className="mt-2 text-2xl font-black">Some occupation standards need configuration</h1>
          <p className="mt-3 leading-7">Sign-offs remain available below for apprentices whose approved Appendix A standard is configured. The portal will not invent competencies for {board.unconfiguredPrograms.map((program) => program.programSlug || 'an unconfigured occupation').join(', ')}.</p>
        </section>
        ) : null}
        <CompetencyManager />
      </div>
    </div>
  );
}
