import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Admin Inbox | Elevate For Humanity',
  description: 'Elevate For Humanity - Career training and workforce development',
};

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';

export const dynamic = 'force-dynamic';

async function requireAdmin(supabase: any) {
  const { data }: any = await supabase.auth.getUser();
  if (!data?.user) return false;

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', data.user.id)
    .single();

  return profile?.role === 'admin';
}

export default async function AdminInboxPage() {
  const supabase = await createClient();

  const isAdmin = await requireAdmin(supabase);

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-bold">Access denied</h1>
        <p className="mt-2 text-zinc-700">Admin only.</p>
      </div>
    );
  }

  const [{ data: partners }, { data: licenses }] = await Promise.all([
    supabase
      .from('partner_inquiries')
      .select('*')
      .order('submitted_at', { ascending: false })
      .limit(50),
    supabase
      .from('license_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  async function updatePartner(formData: FormData) {
    'use server';
    const id = String(formData.get('id'));
    const status = String(formData.get('status'));
    const notes = String(formData.get('internal_notes') || '');

    const supabase2 = await createClient();
    await supabase2
      .from('partner_inquiries')
      .update({ status, notes })
      .eq('id', id);

    const { data: { user: actor } } = await supabase2.auth.getUser();
    if (actor) await logAdminAudit({ action: AdminAction.PARTNER_INQUIRY_REVIEWED, actorId: actor.id, entityType: 'partner_inquiries', entityId: id, metadata: { new_status: status } });

    redirect('/admin/inbox');
  }

  async function updateLicense(formData: FormData) {
    'use server';
    const id = String(formData.get('id'));
    const status = String(formData.get('status'));
    const notes = String(formData.get('internal_notes') || '');

    const supabase2 = await createClient();
    await supabase2
      .from('license_requests')
      .update({ status, internal_notes: notes })
      .eq('id', id);

    const { data: { user: actor } } = await supabase2.auth.getUser();
    if (actor) await logAdminAudit({ action: AdminAction.LICENSE_REQUEST_REVIEWED, actorId: actor.id, entityType: 'license_requests', entityId: id, metadata: { new_status: status } });

    redirect('/admin/inbox');
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">

      {/* Hero Image */}
      <h1 className="text-3xl font-bold text-zinc-900">Admin Inbox</h1>
      <p className="mt-2 text-zinc-700">One place to review everything.</p>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-zinc-900">Partner Inquiries</h2>
          <a
            className="text-sm font-semibold text-zinc-700 underline"
            href="/admin/partner-inquiries"
          >
            Open full list
          </a>
        </div>

        <div className="mt-4 space-y-4">
          {(partners || []).map((r: any) => (
            <div
              key={r.id}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div className="flex-1">
                  <div className="text-lg font-bold text-zinc-900">
                    {r.full_name}
                  </div>
                  <div className="text-sm text-zinc-700">
                    {r.organization || '—'} • {r.email} • {r.phone || '—'}
                  </div>
                  <div className="mt-2 text-sm text-zinc-700">
                    <span className="font-semibold">Type:</span>{' '}
                    {r.relationship_type}
                  </div>
                  <div className="mt-2 text-sm text-zinc-700 whitespace-pre-wrap">
                    <span className="font-semibold">Value:</span> {r.resources}
                  </div>
                  <div className="mt-2 text-xs text-zinc-500">
                    Submitted: {new Date(r.submitted_at).toLocaleString()}
                  </div>
                  <div className="mt-1 inline-block px-2 py-2 text-xs font-semibold rounded bg-zinc-100 text-zinc-700">
                    Status: {r.status}
                  </div>
                </div>

                <form
                  action={updatePartner}
                  className="mt-4 md:mt-0 md:w-[360px] space-y-2"
                >
                  <input type="hidden" name="id" value={r.id} />
                  <label className="block text-sm font-semibold text-zinc-800">
                    Status
                  </label>
                  <select
                    name="status"
                    defaultValue={r.status}
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                  >
                    <option value="pending">pending</option>
                    <option value="reviewing">reviewing</option>
                    <option value="approved">approved</option>
                    <option value="declined">declined</option>
                  </select>

                  <label className="block text-sm font-semibold text-zinc-800">
                    Internal notes
                  </label>
                  <textarea
                    name="internal_notes"
                    defaultValue={r.notes || ''}
                    rows={3}
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                  />

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-zinc-900 px-4 py-2 text-white font-bold hover:bg-zinc-800 transition"
                  >
                    Save
                  </button>
                </form>
              </div>
            </div>
          ))}

          {(!partners || partners.length === 0) && (
            <div className="text-center py-8 text-zinc-600">
              No partner inquiries yet.
            </div>
          )}
        </div>
      </section>

      <section className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-zinc-900">License Requests</h2>
          <a
            className="text-sm font-semibold text-zinc-700 underline"
            href="/admin/license-requests"
          >
            Open full list
          </a>
        </div>

        <div className="mt-4 space-y-4">
          {(licenses || []).map((r: any) => (
            <div
              key={r.id}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div className="flex-1">
                  <div className="text-lg font-bold text-zinc-900">
                    {r.full_name}
                  </div>
                  <div className="text-sm text-zinc-700">
                    {r.organization || '—'} • {r.email} • {r.phone || '—'}
                  </div>
                  <div className="mt-2 text-sm text-zinc-700">
                    <span className="font-semibold">Tier:</span>{' '}
                    {r.desired_tier}
                  </div>
                  <div className="mt-2 text-sm text-zinc-700 whitespace-pre-wrap">
                    <span className="font-semibold">Launch Goal:</span>{' '}
                    {r.launch_goal}
                  </div>
                  <div className="mt-2 text-xs text-zinc-500">
                    Submitted: {new Date(r.created_at).toLocaleString()}
                  </div>
                  <div className="mt-1 inline-block px-2 py-2 text-xs font-semibold rounded bg-zinc-100 text-zinc-700">
                    Status: {r.status}
                  </div>
                </div>

                <form
                  action={updateLicense}
                  className="mt-4 md:mt-0 md:w-[360px] space-y-2"
                >
                  <input type="hidden" name="id" value={r.id} />
                  <label className="block text-sm font-semibold text-zinc-800">
                    Status
                  </label>
                  <select
                    name="status"
                    defaultValue={r.status}
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                  >
                    <option value="submitted">submitted</option>
                    <option value="reviewed">reviewed</option>
                    <option value="advanced">advanced</option>
                    <option value="declined">declined</option>
                  </select>

                  <label className="block text-sm font-semibold text-zinc-800">
                    Internal notes
                  </label>
                  <textarea
                    name="internal_notes"
                    defaultValue={r.internal_notes || ''}
                    rows={3}
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                  />

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-zinc-900 px-4 py-2 text-white font-bold hover:bg-zinc-800 transition"
                  >
                    Save
                  </button>
                </form>
              </div>
            </div>
          ))}

          {(!licenses || licenses.length === 0) && (
            <div className="text-center py-8 text-zinc-600">
              No license requests yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
