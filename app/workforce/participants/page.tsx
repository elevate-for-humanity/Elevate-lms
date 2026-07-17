import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { Users, ChevronRight, Search } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Participants | Workforce Portal',
};

export const dynamic = 'force-dynamic';

export default async function WorkforceParticipantsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; q?: string }>;
}) {
  await requireRole(['workforce_board', 'case_manager', 'admin', 'super_admin', 'staff', 'org_admin']);

  const { filter, q } = await searchParams;

  const supabase = await createClient();
  const admin = await requireAdminClient();
  const db = admin || supabase;

  let query = db
    .from('profiles')
    .select('id, full_name, email, role, created_at')
    .eq('role', 'student')
    .order('created_at', { ascending: false })
    .limit(100);

  if (q) {
    query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);
  }

  const { data: participants } = await query;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Participants</h1>
          <p className="text-sm text-slate-500 mt-1">
            {participants?.length ?? 0} participant{(participants?.length ?? 0) !== 1 ? 's' : ''}
            {filter ? ` · filtered: ${filter}` : ''}
          </p>
        </div>
        <Link
          href="/workforce/dashboard"
          className="text-sm text-brand-blue-600 hover:text-brand-blue-800 flex items-center gap-1"
        >
          Dashboard <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Search */}
      <form method="GET" className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by name or email…"
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-400"
          />
        </div>
      </form>

      {/* Table */}
      {!participants?.length ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600">No participants found</p>
          {q && (
            <Link href="/workforce/participants" className="text-xs text-brand-blue-600 hover:underline mt-2 inline-block">
              Clear search
            </Link>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Email</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Joined</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {participants.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {p.full_name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.email}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/case-manager/students/${p.id}`}
                      className="text-xs font-medium text-brand-blue-600 hover:text-brand-blue-800"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
