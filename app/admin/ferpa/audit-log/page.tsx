import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { requireAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { Shield } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: `FERPA Audit Log | Admin | ${PLATFORM_DEFAULTS.orgName}`,
};

const FERPA_ACTIONS = [
  'ferpa.access_request',
  'ferpa.disclosure',
  'ferpa.consent',
  'ferpa.opt_out',
  'ferpa.directory_info_change',
  'ferpa.record_amendment',
  'document.viewed',
  'document.downloaded',
  'document.shared',
];

async function getFerpaAuditLog() {
  const adminClient = await requireAdminClient();
  const fallback = await createClient();
  const db = adminClient ?? fallback;

  const { data, error } = await db
    .from('audit_logs')
    .select(
      'id, action, actor_id, target_id, metadata, created_at, profiles:actor_id(full_name, email)',
    )
    .in('action', FERPA_ACTIONS)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) return [];
  return data ?? [];
}

const actionColor: Record<string, string> = {
  'ferpa.disclosure': 'bg-red-100 text-red-700',
  'ferpa.access_request': 'bg-amber-100 text-amber-700',
  'ferpa.consent': 'bg-green-100 text-green-700',
  'ferpa.opt_out': 'bg-purple-100 text-purple-700',
  'document.viewed': 'bg-blue-100 text-blue-700',
  'document.downloaded': 'bg-blue-100 text-blue-700',
};

export default async function FerpaAuditLogPage() {
  await requireRole(['admin', 'super_admin']);
  const entries = await getFerpaAuditLog();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Breadcrumbs
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'FERPA', href: '/admin/ferpa' },
            { label: 'Audit Log' },
          ]}
        />

        <div className="mt-6 mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">FERPA Audit Log</h1>
            <p className="text-slate-600 mt-1">
              All FERPA-relevant actions — disclosures, access requests, consent changes, and record
              views.
            </p>
          </div>
          <span className="text-sm text-slate-500">{entries.length} entries</span>
        </div>

        {entries.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Shield className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">No FERPA audit entries found</p>
            <p className="text-slate-500 text-sm mt-1">
              FERPA-relevant actions will be logged here automatically.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-slate-700">Timestamp</th>
                  <th className="px-6 py-3 text-left font-medium text-slate-700">Action</th>
                  <th className="px-6 py-3 text-left font-medium text-slate-700">Actor</th>
                  <th className="px-6 py-3 text-left font-medium text-slate-700">Target</th>
                  <th className="px-6 py-3 text-left font-medium text-slate-700">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entries.map((e: any) => (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3 text-slate-500 whitespace-nowrap">
                      {new Date(e.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${actionColor[e.action] ?? 'bg-slate-100 text-slate-700'}`}
                      >
                        {e.action}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-slate-700">
                      {(e.profiles as any)?.full_name ??
                        (e.profiles as any)?.email ??
                        e.actor_id?.slice(0, 8) + '…'}
                    </td>
                    <td className="px-6 py-3 text-slate-500 font-mono text-xs">
                      {e.target_id ? e.target_id.slice(0, 8) + '…' : '—'}
                    </td>
                    <td className="px-6 py-3 text-slate-500 max-w-xs truncate">
                      {e.metadata ? JSON.stringify(e.metadata).slice(0, 80) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
