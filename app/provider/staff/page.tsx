import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Users } from 'lucide-react';
import InviteStaff from './InviteStaff';

export const dynamic = 'force-dynamic';

const ROLE_LABELS: Record<string, string> = {
  provider_admin: 'Admin',
  instructor: 'Instructor',
  staff: 'Staff',
};

export default async function ProviderStaffPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/provider/staff');

  const db = createAdminClient()!;
  const { data: profile } = await db.from('profiles').select('tenant_id').eq('id', user.id).single();
  if (!profile?.tenant_id) redirect('/unauthorized');

  const { data: staff } = await db
    .from('profiles')
    .select('id, email, full_name, role, created_at')
    .eq('tenant_id', profile.tenant_id)
    .in('role', ['provider_admin', 'instructor', 'staff'])
    .order('created_at');

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Staff</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Manage staff accounts for your organization. Staff are scoped to your tenant only.
        </p>
      </div>

      {/* Staff list */}
      <div className="bg-white rounded-xl border border-slate-200 mb-6">
        {(staff ?? []).length === 0 ? (
          <div className="p-10 text-center">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No staff accounts yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {(staff ?? []).map(member => (
              <div key={member.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <div className="text-sm font-medium text-slate-900">
                    {member.full_name ?? member.email}
                  </div>
                  {member.full_name && (
                    <div className="text-xs text-slate-400 mt-0.5">{member.email}</div>
                  )}
                </div>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                  {ROLE_LABELS[member.role] ?? member.role}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite form */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-900 text-sm mb-4">Invite Staff Member</h2>
        <InviteStaff tenantId={profile.tenant_id} />
      </div>
    </div>
  );
}
