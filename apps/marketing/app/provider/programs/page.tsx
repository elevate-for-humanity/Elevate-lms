import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus, BookOpen } from 'lucide-react';
import { requireProviderPortal } from '@/lib/auth/provider-access';

export const metadata = { robots: { index: false } };
export const dynamic = 'force-dynamic';

const STATUS_COLORS: Record<string, string> = {
  published: 'bg-brand-green-100 text-brand-green-700',
  pending_review: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-brand-blue-100 text-brand-blue-700',
  rejected: 'bg-red-100 text-red-700',
  draft: 'bg-white text-slate-500',
};

export default async function ProviderProgramsPage({ searchParams }: { searchParams: Promise<{ tenant?: string }> }) {
  const { tenant: requestedTenant } = await searchParams;
  const access = await requireProviderPortal(requestedTenant);
  if (access.isPlatformAdmin && access.platformWide) redirect('/provider/dashboard');
  const tenantId = access.tenantId!;

  const { data: programs } = await access.db
    .from('programs')
    .select('id, title, status, published, is_active, created_at, next_start_date, seats_available, credential_name')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  const tenantSuffix = access.isPlatformAdmin ? `?tenant=${encodeURIComponent(tenantId)}` : '';

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Programs</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage provider program submissions.</p>
          {access.isPlatformAdmin ? <p className="mt-1 text-xs font-bold text-amber-700">Admin oversight · tenant {tenantId}</p> : null}
        </div>
        <Link href={`/provider/programs/new${tenantSuffix}`} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition">
          <Plus className="w-4 h-4" /> Submit Program
        </Link>
      </div>

      {(programs ?? []).length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm mb-4">No programs submitted yet.</p>
          <Link href={`/provider/programs/new${tenantSuffix}`} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition">
            <Plus className="w-4 h-4" /> Submit Your First Program
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {(programs ?? []).map((prog: any) => {
            const displayStatus = prog.published && prog.is_active ? 'published' : (prog.status ?? 'draft');
            return (
              <div key={prog.id} className="flex items-center justify-between px-5 py-4 gap-4">
                <div>
                  <div className="font-medium text-slate-900">{prog.title ?? '(untitled)'}</div>
                  <div className="text-xs text-slate-400 mt-0.5 flex flex-wrap gap-3">
                    {prog.credential_name && <span>{prog.credential_name}</span>}
                    {prog.next_start_date && <span>Starts {new Date(prog.next_start_date).toLocaleDateString()}</span>}
                    {prog.seats_available != null && <span>{prog.seats_available} seats</span>}
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_COLORS[displayStatus] ?? 'bg-white text-slate-500'}`}>{displayStatus.replace('_', ' ')}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
