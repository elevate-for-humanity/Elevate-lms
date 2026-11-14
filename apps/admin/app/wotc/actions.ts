'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { prepareSSNForStorage } from '@/lib/security/ssn';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';
import { logger } from '@/lib/logger';

async function requireWotcAdmin() {
  const supabase = await createClient();
  const db = await requireAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) throw new Error('Forbidden');
  return { db, user };
}

function applicationFields(formData: FormData) {
  const rawSsn = String(formData.get('ssn') || '');
  const ssn = rawSsn ? prepareSSNForStorage(rawSsn) : { ssn_hash: '', ssn_last4: '' };
  return {
    fields: {
      employee_first_name: String(formData.get('firstName') || ''),
      employee_last_name: String(formData.get('lastName') || ''),
      employee_ssn_hash: ssn.ssn_hash,
      employee_ssn_last4: ssn.ssn_last4,
      employee_dob: String(formData.get('dob') || ''),
      employer_name: String(formData.get('employerName') || ''),
      employer_ein: String(formData.get('ein') || ''),
      employer_phone: String(formData.get('employerPhone') || '') || null,
      job_offer_date: String(formData.get('offerDate') || ''),
      start_date: String(formData.get('startDate') || ''),
      starting_wage: Number.parseFloat(String(formData.get('wage') || '')) || null,
      position: String(formData.get('position') || ''),
      target_groups: formData.getAll('targetGroups').map(String),
    },
    ssnLast4: ssn.ssn_last4,
  };
}

/** Form action contract intentionally resolves void; errors are thrown so Next can surface failure. */
export async function createWOTCApplication(formData: FormData): Promise<void> {
  const { db, user } = await requireWotcAdmin();
  const { fields, ssnLast4 } = applicationFields(formData);
  const startDate = new Date(`${fields.start_date}T00:00:00Z`);
  if (!fields.start_date || Number.isNaN(startDate.getTime()) || startDate.getUTCFullYear() > 2025) {
    throw new Error('Form 8850 is obsolete and WOTC applications are limited to eligible hires who started on or before December 31, 2025.');
  }
  const draft = Boolean(formData.get('saveAsDraft'));
  const { data, error } = await db.from('wotc_applications').insert({
    ...fields,
    status: draft ? 'draft' : 'submitted',
    submitted_by: user.id,
    submitted_at: draft ? null : new Date().toISOString(),
  }).select('id').single();
  if (error || !data) {
    logger.error('[wotc] create failed', error instanceof Error ? error : undefined);
    throw new Error('WOTC application could not be created');
  }
  await logAdminAudit({ action: AdminAction.WOTC_APPLICATION_CREATED, actorId: user.id, entityType: 'wotc_applications', entityId: data.id, metadata: { employer_name: fields.employer_name, ssn_last4: ssnLast4 } });
  revalidatePath('/wotc');
  redirect('/wotc');
}

export async function updateWOTCApplication(id: string, formData: FormData) {
  try {
    const { db, user } = await requireWotcAdmin();
    const { fields } = applicationFields(formData);
    const { data: existing } = await db.from('wotc_applications').select('id').eq('id', id).maybeSingle();
    if (!existing) return { error: 'Requested WOTC record is unavailable' };
    const { error } = await db.from('wotc_applications').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) return { error: 'Operation failed' };
    await logAdminAudit({ action: AdminAction.WOTC_APPLICATION_UPDATED, actorId: user.id, entityType: 'wotc_applications', entityId: id, metadata: { employer_name: fields.employer_name } });
    revalidatePath('/wotc');
    revalidatePath(`/wotc/${id}`);
    redirect('/wotc');
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Operation failed' };
  }
}

export async function submitWOTCApplication(id: string) {
  try {
    const { db } = await requireWotcAdmin();
    const { data: record } = await db.from('wotc_applications').select('id,status').eq('id', id).maybeSingle();
    if (!record) return { error: 'Requested WOTC record is unavailable' };
    if (record.status !== 'draft') return { error: 'Only draft applications can be submitted' };
    const { error } = await db.from('wotc_applications').update({ status: 'submitted', submitted_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', id);
    if (error) return { error: 'Operation failed' };
    revalidatePath('/wotc');
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Operation failed' };
  }
}

export async function updateWOTCStatus(id: string, status: string, notes?: string) {
  try {
    const { db } = await requireWotcAdmin();
    const { data: record } = await db.from('wotc_applications').select('id').eq('id', id).maybeSingle();
    if (!record) return { error: 'Requested WOTC record is unavailable' };
    const update: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
    if (status === 'approved') update.certification_date = new Date().toISOString();
    if (notes) update.reviewer_notes = notes;
    const { error } = await db.from('wotc_applications').update(update).eq('id', id);
    if (error) return { error: 'Operation failed' };
    revalidatePath('/wotc');
    revalidatePath(`/wotc/${id}`);
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Operation failed' };
  }
}

export async function deleteWOTCApplication(id: string) {
  const { db, user } = await requireWotcAdmin();
  const { data: record } = await db.from('wotc_applications').select('id').eq('id', id).maybeSingle();
  if (!record) return { error: 'Requested WOTC record is unavailable' };
  const { error } = await db.from('wotc_applications').delete().eq('id', id);
  if (error) return { error: 'Operation failed' };
  await logAdminAudit({ action: AdminAction.WOTC_APPLICATION_DELETED, actorId: user.id, entityType: 'wotc_applications', entityId: id, metadata: {} });
  revalidatePath('/wotc');
  redirect('/wotc');
}