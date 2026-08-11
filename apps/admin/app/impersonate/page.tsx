import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import ImpersonateForm from './ImpersonateForm';
import { hasPermission } from '@/lib/rbac/role-matrix';
import type { UserRole } from '@/lib/rbac/role-matrix';

export const metadata: Metadata = { robots: { index: false }, title: 'User Impersonation | Admin | Elevate' };
export const dynamic = 'force-dynamic';

export default async function ImpersonatePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!hasPermission(profile?.role as UserRole, 'impersonate_users')) redirect('/unauthorized');

  const { data: recentSessions } = await supabase
    .from('admin_audit_events')
    .select('id, actor_user_id, entity_id, after_state, created_at')
    .eq('entity', 'impersonation_session')
    .eq('action', 'create')
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-900 px-6 py-6 text-white">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-lg bg-white p-2 text-slate-900"><Breadcrumbs items={[{ label: 'Admin', href: '/dashboard' }, { label: 'Impersonate User' }]} /></div>
          <h1 className="mt-3 text-xl font-extrabold">User Impersonation</h1>
          <p className="mt-1 text-sm text-slate-300">Support tool — view the platform as a specific user. Every session is logged.</p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-8 px-6 py-8">
        <div className="flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4"><span className="text-lg text-amber-600">⚠️</span><div><p className="text-sm font-bold text-amber-800">Impersonation is fully audited</p><p className="mt-0.5 text-sm text-amber-700">Every session start and end is written to the audit log with the acting user, target user, timestamp and reason.</p></div></div>
        <ImpersonateForm />
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-4"><h2 className="text-sm font-bold text-slate-900">Recent Impersonation Sessions</h2></div>
          {!recentSessions?.length ? <p className="px-5 py-6 text-sm text-slate-500">No recent sessions.</p> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-slate-100 bg-slate-50"><th className="px-5 py-3 text-left font-semibold text-slate-600">Target User</th><th className="px-5 py-3 text-left font-semibold text-slate-600">Reason</th><th className="px-5 py-3 text-left font-semibold text-slate-600">Started</th></tr></thead><tbody className="divide-y divide-slate-100">{recentSessions.map((session: any) => { const after = session.after_state ?? {}; return <tr key={session.id}><td className="px-5 py-3"><p className="font-medium text-slate-900">{after.target_user_name ?? '—'}</p><p className="text-xs text-slate-500">{after.target_user_email ?? session.entity_id}</p></td><td className="px-5 py-3 text-xs text-slate-600">{after.reason ?? '—'}</td><td className="px-5 py-3 text-xs text-slate-500">{session.created_at ? new Date(session.created_at).toLocaleString() : '—'}</td></tr>; })}</tbody></table></div>}
        </div>
      </div>
    </div>
  );
}
