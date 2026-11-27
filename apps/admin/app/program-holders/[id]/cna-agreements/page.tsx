import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import {
  ACHIEVE_HOLDER_ID,
  ACHIEVE_SCHEDULE_FIELDS,
  achieveCnaAgreements,
} from '@/lib/program-holder/achieve-cna-agreements';

export const dynamic = 'force-dynamic';

export default async function AchieveCnaAgreementPublication({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ result?: string }>;
}) {
  const { profile } = await requireRole(['admin']);
  if (!['admin', 'super_admin'].includes(String(profile.role))) redirect('/unauthorized');
  const { id } = await params;
  if (id !== ACHIEVE_HOLDER_ID) notFound();
  const destination = `/program-holders/${id}/cna-agreements`;
  const db = await requireAdminClient();
  const { data: holder, error } = await db.from('program_holders')
    .select('features,status,approved_at').eq('id', id).maybeSingle();
  if (error || !holder) notFound();
  const current = achieveCnaAgreements(holder.features);
  const expected = holder.features?.achieve_cna_agreements ?? null;
  const { result } = await searchParams;
  const messages: Record<string, string> = {
    published: 'The current packet is available in the Achieve portal for signature.',
    incomplete: 'Provide the approved documents, all Schedule A terms, and the approval reference.',
    changed: 'The holder or agreement changed. Review the current record before publishing.',
    failed: 'The packet could not be published. Try again.',
  };

  async function publish(form: FormData) {
    'use server';
    const { user, profile: actor } = await requireRole(['admin']);
    if (!['admin', 'super_admin'].includes(String(actor.role))) redirect('/unauthorized');
    const text = (key: string) => {
      const value = form.get(key);
      return typeof value === 'string' ? value.trim() : '';
    };
    const packet = {
      mou: text('mou'),
      nda: text('nda'),
      program_scope: text('program_scope'),
      incorporated_terms: text('incorporated_terms'),
      approval_reference: text('approval_reference'),
      schedule_a: Object.fromEntries(Object.keys(ACHIEVE_SCHEDULE_FIELDS).map((key) => [key, text(key)])),
    };
    const approvedPacket = achieveCnaAgreements({ achieve_cna_agreements: packet });
    if (form.get('confirm_approval') !== 'yes' || !approvedPacket) {
      redirect(`${destination}?result=incomplete`);
    }
    const admin = await requireAdminClient();
    const { error: publishError } = await admin.rpc('publish_achieve_cna_packet_v1', {
      p_actor_id: user.id,
      p_expected: expected,
      p_packet: packet,
      p_packet_digest: approvedPacket.digest,
    });
    if (publishError) redirect(`${destination}?result=${publishError.code === '23514' ? 'changed' : 'failed'}`);
    redirect(`${destination}?result=published`);
  }

  return (
    <main className="mx-auto max-w-3xl space-y-5 p-6">
      <Link className="font-bold underline" href={`/program-holders/${id}`}>Back to Achieve</Link>
      <h1 className="text-3xl font-black">Publish the finalized Achieve CNA agreements</h1>
      <p>Use the approved MOU, separate NDA, exact program scope, incorporated terms, and Schedule A. Publication makes one immutable packet available for signatures. Replacing it requires new signatures.</p>
      {result && messages[result] && <p role="status" className="rounded-lg border p-3">{messages[result]}</p>}
      {!holder.approved_at || !['active', 'approved', 'approved_pending_mou'].includes(holder.status) ? (
        <p>Complete the program holder approval before publishing the agreement packet.</p>
      ) : (
        <form action={publish} className="space-y-4">
          <label className="block font-bold">Approval record reference
            <input className="mt-1 w-full rounded border p-2 font-normal" name="approval_reference"
              defaultValue={current?.approvalReference} maxLength={300} required />
          </label>
          <label className="block font-bold">Final CNA MOU text
            <textarea className="mt-1 w-full rounded border p-2 font-normal" name="mou" rows={9}
              defaultValue={current?.mou} maxLength={32000} required />
          </label>
          <label className="block font-bold">Final separate CNA NDA text
            <textarea className="mt-1 w-full rounded border p-2 font-normal" name="nda" rows={9}
              defaultValue={current?.nda} maxLength={32000} required />
          </label>
          <label className="block font-bold">Approved program scope included in the MOU
            <textarea className="mt-1 w-full rounded border p-2 font-normal" name="program_scope" rows={5}
              defaultValue={current?.programScope ?? ''} maxLength={32000} required />
          </label>
          <label className="block font-bold">Full incorporated terms included in the signed MOU artifact
            <textarea className="mt-1 w-full rounded border p-2 font-normal" name="incorporated_terms" rows={9}
              defaultValue={current?.incorporatedTerms ?? ''} maxLength={32000} required />
          </label>
          <fieldset className="space-y-3 rounded border p-4">
            <legend className="px-1 font-bold">Final Schedule A</legend>
            {Object.entries(ACHIEVE_SCHEDULE_FIELDS).map(([key, label]) => (
              <label className="block font-bold" key={key}>{label}
                <textarea className="mt-1 w-full rounded border p-2 font-normal" name={key} rows={2}
                  defaultValue={current?.scheduleTerms.find((term) => term.label === label)?.value}
                  maxLength={4000} required />
              </label>
            ))}
          </fieldset>
          <label className="flex gap-2">
            <input type="checkbox" name="confirm_approval" value="yes" required />
            I verified the MOU, NDA, program scope, incorporated terms, Schedule A, and approval reference against the approved agreement record.
          </label>
          <button type="submit" className="rounded-lg bg-blue-800 px-4 py-2 font-bold text-white">
            Publish for signature
          </button>
        </form>
      )}
    </main>
  );
}
