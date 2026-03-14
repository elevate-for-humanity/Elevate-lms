import { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import ImpersonateForm from './ImpersonateForm';

export const metadata: Metadata = {
  title: 'User Impersonation | Admin | Elevate',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function ImpersonatePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const db = createAdminClient();
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!['admin', 'super_admin'].includes(profile?.role ?? '')) {
    redirect('/unauthorized');
  }

  // Recent impersonation audit entries for visibility
  const { data: recentSessions } = await db
    .from('admin_audit_events')
    .select('id, actor_user_id, entity_id, after_state, created_at')
    .eq('entity', 'impersonation_session')
    .eq('action', 'create')
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-slate-900 text-white px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <Breadcrumbs
            items={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Impersonate User' }]}
            dark
          />
          <h1 className="text-xl font-extrabold mt-3">User Impersonation</h1>
          <p className="text-slate-400 text-sm mt-1">
            Support tool — view the platform as a specific user. Every session is logged.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">

        {/* Warning banner */}
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex gap-3">
          <span className="text-amber-600 text-lg">⚠️</span>
          <div>
            <p className="font-bold text-amber-800 text-sm">Impersonation is fully audited</p>
            <p className="text-amber-700 text-sm mt-0.5">
              Every session start and end is written to the immutable audit log with your user ID,
              the target user ID, timestamp, and reason. Admin users cannot be impersonated.
            </p>
          </div>
        </div>

        {/* Impersonation form */}
        <ImpersonateForm />

        {/* Recent sessions */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900 text-sm">Recent Impersonation Sessions</h2>
          </div>
          {!recentSessions?.length ? (
            <p className="px-5 py-6 text-slate-500 text-sm">No recent sessions.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-5 py-3 font-semibold text-slate-600">Target User</th>
                    <th className="text-left px-5 py-3 font-semibold text-slate-600">Reason</th>
                    <th className="text-left px-5 py-3 font-semibold text-slate-600">Started</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentSessions.map((s: any) => {
                    const after = s.after_state ?? {};
                    return (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3">
                          <p className="font-medium text-slate-900">{after.target_user_name ?? '—'}</p>
                          <p className="text-xs text-slate-500">{after.target_user_email ?? s.entity_id}</p>
                        </td>
                        <td className="px-5 py-3 text-slate-600 text-xs">{after.reason ?? '—'}</td>
                        <td className="px-5 py-3 text-slate-500 text-xs">
                          {s.created_at ? new Date(s.created_at).toLocaleString() : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
