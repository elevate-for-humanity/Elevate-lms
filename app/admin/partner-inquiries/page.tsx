import Image from 'next/image';
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Admin Partner Inquiries | Elevate For Humanity',
  description: 'Elevate For Humanity - Career training and workforce development',
};

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';

export const dynamic = 'force-dynamic';

export default async function PartnerInquiriesAdminPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Partner Inquiries" }]} />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-bold">Access denied</h1>
        <p className="mt-2 text-zinc-700">Admin only.</p>
      </div>
    );
  }

  const { data: rows } = await db
    .from('partner_inquiries')
    .select('*')
    .order('submitted_at', { ascending: false });

  async function updateStatus(formData: FormData) {
    'use server';
    const id = String(formData.get('id'));
    const status = String(formData.get('status'));
    const notes = String(formData.get('internal_notes') || '');

    const adminDb = createAdminClient();
    if (adminDb) {
      await adminDb
        .from('partner_inquiries')
        .update({ status, notes, reviewed_at: new Date().toISOString() })
        .eq('id', id);
    }

    const supabase2 = await createClient();
    const { data: { user: actor } } = await supabase2.auth.getUser();
    if (actor) await logAdminAudit({ action: AdminAction.PARTNER_INQUIRY_REVIEWED, actorId: actor.id, entityType: 'partner_inquiries', entityId: id, metadata: { new_status: status } });

    redirect('/admin/partner-inquiries');
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/heroes-hq/about-hero.jpg" alt="Administration" fill sizes="100vw" className="object-cover" priority />
      </section>
      <h1 className="text-3xl font-bold text-zinc-900">Partner Inquiries</h1>
      <p className="mt-2 text-zinc-700">
        Review and change status in one click.
      </p>

      <div className="mt-8 space-y-4">
        {(rows || []).map((r: any) => (
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
                <div className="mt-2 text-sm text-zinc-700">
                  <span className="font-semibold">Seeking:</span> {r.seeking}
                </div>
                <div className="mt-2 text-sm text-zinc-700 whitespace-pre-wrap">
                  <span className="font-semibold">Value:</span> {r.resources}
                </div>
                <div className="mt-2 text-sm text-zinc-700">
                  <span className="font-semibold">Written Agreement:</span>{' '}
                  {r.written_agreement}
                </div>
                {r.additional_info && (
                  <div className="mt-2 text-sm text-zinc-700 whitespace-pre-wrap">
                    <span className="font-semibold">Additional:</span>{' '}
                    {r.additional_info}
                  </div>
                )}
                <div className="mt-2 text-xs text-zinc-500">
                  Submitted: {new Date(r.submitted_at).toLocaleString()}
                </div>
                <div className="mt-1 inline-block px-2 py-2 text-xs font-semibold rounded bg-zinc-100 text-zinc-700">
                  Status: {r.status}
                </div>
              </div>

              <form
                action={updateStatus}
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

        {(!rows || rows.length === 0) && (
          <div className="text-center py-12 text-zinc-600">
            No partner inquiries yet.
          </div>
        )}
      </div>
    </div>
  );
}
