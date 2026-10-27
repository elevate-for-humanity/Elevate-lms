import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { requireAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth/require-role';
import Link from 'next/link';
import { AlertTriangle, Building2, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import ResendOnboardingButton from './ResendOnboardingButton';
import { OpenPortalPreviewButton } from '@/components/admin/OpenPortalPreviewButton';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Program Holders | Admin | Elevate For Humanity',
  description: 'Manage program holder organizations and approvals.',
};

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-brand-green-100 text-brand-green-800',
  pending: 'bg-amber-100 text-amber-800',
  rejected: 'bg-brand-red-100 text-brand-red-800',
  suspended: 'bg-slate-100 text-slate-700',
};

export default async function AdminProgramHoldersPage() {
  await requireRole(['admin', 'staff']);
  const supabase = await requireAdminClient();

  // Fetch all program holders
  const [{ data: holders }, { data: roleProfiles }] = await Promise.all([
    supabase
      .from('program_holders')
      .select(
        'id, organization_name, name, contact_name, contact_email, contact_phone, status, mou_signed, created_at, user_id',
      )
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('id,full_name,email,role,program_holder_id,is_active')
      .in('role', ['program_holder', 'programholder', 'site_coordinator']),
  ]);

  // Fetch program counts per holder
  const holderIds = (holders || []).map((h: any) => h.id);
  const { data: programCounts } =
    holderIds.length > 0
      ? await supabase
          .from('program_holder_programs')
          .select('program_holder_id')
          .in('program_holder_id', holderIds)
      : { data: [] };

  const countMap: Record<string, number> = {};
  (programCounts || []).forEach((pc: any) => {
    countMap[pc.program_holder_id] = (countMap[pc.program_holder_id] || 0) + 1;
  });

  // QA fixtures remain in the database for auditability but must never be
  // presented as production organizations or included in operating totals.
  const items = (holders || []).filter((holder: any) => {
    const email = String(holder.contact_email || '').toLowerCase();
    const organization = String(holder.organization_name || holder.name || '').trim();
    const contact = String(holder.contact_name || '').trim();
    return (
      !email.endsWith('@qa.invalid') &&
      !/^\[qa(?:\s|\])/i.test(organization) &&
      !/^\[qa(?:\s|\])/i.test(contact)
    );
  });
  const pending = items.filter((h: any) => h.status === 'pending').length;
  const active = items.filter((h: any) => ['active', 'approved'].includes(h.status)).length;
  const linkedUserIds = new Set((holders || []).map((holder: any) => holder.user_id).filter(Boolean));
  const linkedHolderIds = new Set((holders || []).map((holder: any) => holder.id));
  const unlinkedRoleProfiles = (roleProfiles || []).filter((profile: any) => {
    const email = String(profile.email || '').toLowerCase();
    const name = String(profile.full_name || '').trim();
    return (
      profile.is_active !== false &&
      !email.endsWith('@qa.invalid') &&
      !/^\[qa(?:\s|\])/i.test(name) &&
      !linkedUserIds.has(profile.id) &&
      (!profile.program_holder_id || !linkedHolderIds.has(profile.program_holder_id))
    );
  });

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-4">
          <Breadcrumbs
            items={[{ label: 'Admin', href: '/dashboard' }, { label: 'Program Holders' }]}
          />
        </div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Program Holders</h1>
            <p className="text-slate-700 mt-1">Manage program holder organizations and approvals</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 xl:grid-cols-4">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-5 h-5 text-slate-700" />
              <h3 className="text-sm font-medium text-slate-700">Total</h3>
            </div>
            <p className="text-3xl font-bold text-slate-900">{items.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-medium text-slate-700">Pending Approval</h3>
            </div>
            <p className="text-3xl font-bold text-amber-600">{pending}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-brand-green-500" />
              <h3 className="text-sm font-medium text-slate-700">Active</h3>
            </div>
            <p className="text-3xl font-bold text-brand-green-600">{active}</p>
          </div>
          <div className={`rounded-lg border p-6 shadow-sm ${unlinkedRoleProfiles.length ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white'}`}>
            <div className="mb-2 flex items-center gap-2">
              <AlertTriangle className={`h-5 w-5 ${unlinkedRoleProfiles.length ? 'text-amber-700' : 'text-slate-500'}`} />
              <h3 className="text-sm font-medium text-slate-700">Unlinked Role Accounts</h3>
            </div>
            <p className={`text-3xl font-bold ${unlinkedRoleProfiles.length ? 'text-amber-800' : 'text-slate-900'}`}>{unlinkedRoleProfiles.length}</p>
          </div>
        </div>

        {unlinkedRoleProfiles.length ? (
          <section className="mb-8 rounded-2xl border border-amber-300 bg-amber-50 p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-amber-800" />
              <div>
                <h2 className="text-lg font-black text-amber-950">Program Holder role accounts need review</h2>
                <p className="mt-1 text-sm leading-6 text-amber-950">
                  These active user profiles have a Program Holder or Site Coordinator role but no linked Program Holder organization. They cannot receive programs, applicants, phone, email, or a complete dashboard until an approved organization record is linked.
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {unlinkedRoleProfiles.map((profile: any) => (
                <article key={profile.id} className="rounded-xl border border-amber-200 bg-white p-4">
                  <p className="font-black text-slate-950">{profile.full_name || 'Unnamed user'}</p>
                  <p className="mt-1 text-sm text-slate-700">{profile.email || 'No email recorded'}</p>
                  <p className="mt-2 text-xs font-black uppercase tracking-wide text-amber-800">
                    {String(profile.role).replaceAll('_', ' ')} · organization link required
                  </p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border">
          {items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-700 border-b bg-slate-50">
                    <th className="px-4 py-3 font-medium">Organization</th>
                    <th className="px-4 py-3 font-medium">Contact</th>
                    <th className="px-4 py-3 font-medium text-center">Programs</th>
                    <th className="px-4 py-3 font-medium text-center">MOU</th>
                    <th className="px-4 py-3 font-medium text-center">Status</th>
                    <th className="px-4 py-3 font-medium">Applied</th>
                    <th className="px-4 py-3 font-medium text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((h: any) => (
                    <tr key={h.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">
                          {h.organization_name || h.name || 'Unnamed'}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-900">{h.contact_name || '—'}</p>
                        <p className="text-xs text-slate-700">{h.contact_email || ''}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`font-medium ${(countMap[h.id] || 0) === 0 ? 'text-amber-600' : 'text-slate-900'}`}
                        >
                          {countMap[h.id] || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {h.mou_signed ? (
                          <CheckCircle className="w-4 h-4 text-brand-green-600 mx-auto" />
                        ) : (
                          <XCircle className="w-4 h-4 text-slate-700 mx-auto" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded ${STATUS_STYLES[h.status] || 'bg-slate-100 text-slate-700'}`}
                        >
                          {h.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700 text-xs">
                        {new Date(h.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <Link
                            href={`/program-holders/${h.id}`}
                            className="inline-flex items-center gap-1 text-brand-blue-600 hover:underline text-sm font-medium"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Review
                          </Link>
                          <ResendOnboardingButton holderId={h.id} />
                          {h.user_id ? <OpenPortalPreviewButton targetUserId={h.user_id} label="Open Portal" reason={`Admin review of Program Holder ${h.id}`} /> : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <Building2 className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-700 font-medium">No program holders yet</p>
              <p className="text-sm text-slate-700 mt-1">
                Program holder applications will appear here when submitted.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
