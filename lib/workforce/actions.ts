'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getWorkforceTool } from './tools';
import { auditLog } from '@/lib/logging/auditLog';

async function saveRecord(tool: 'placements' | 'follow-ups', form: FormData) {
  const { ctx, rows } = await getWorkforceTool(tool);
  const id = String(form.get('id') ?? '');
  const note = String(form.get('note') ?? '')
    .trim()
    .slice(0, 2000);
  const row = rows.find((record) => String(record.id) === id);
  if (!row || !note) redirect(`/workforce/${tool}?error=invalid-record`);
  const now = new Date().toISOString();
  const method = String(form.get('method') ?? '');
  if (
    tool === 'placements' &&
    !['employer_contact', 'pay_stub', 'offer_letter', 'self_report'].includes(method)
  )
    redirect('/workforce/placements?error=invalid-method');
  const table = tool === 'placements' ? 'placement_records' : 'followup_schedule';
  const update =
    tool === 'placements'
      ? {
          status: 'verified',
          verified_at: now,
          verified_by: ctx.user.id,
          verification_method: method,
          notes: note,
          updated_at: now,
        }
      : {
          status: 'completed',
          completed_date: now.slice(0, 10),
          outcome_notes: note,
          updated_at: now,
        };
  if (tool === 'placements' && row.status !== 'pending')
    redirect('/workforce/placements?error=not-pending');
  const result = await ctx.db
    .from(table)
    .update(update)
    .eq('id', row.id)
    .eq('status', row.status)
    .select('id')
    .maybeSingle();
  if (result.error || !result.data) redirect(`/workforce/${tool}?error=save-failed`);
  await auditLog({
    actorId: ctx.user.id,
    actorRole: ctx.profile.role,
    action: `workforce:${tool}:update`,
    entity: table,
    entityId: id,
    metadata: { from_status: row.status, to_status: update.status },
  });
  revalidatePath('/workforce/dashboard');
  revalidatePath(`/workforce/${tool}`);
  redirect(`/workforce/${tool}?saved=true`);
}

export async function verifyPlacement(form: FormData) {
  await saveRecord('placements', form);
}
export async function completeFollowUp(form: FormData) {
  await saveRecord('follow-ups', form);
}
