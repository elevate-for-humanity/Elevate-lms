'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prepareSSNForStorage } from '@/lib/security/ssn';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';

export async function createWOTCApplication(formData: FormData) {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Not authenticated' };
  }
  const { data: _p } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (!_p || !['admin', 'super_admin'].includes(_p.role)) return { error: 'Forbidden' };

  // Get target groups as array
  const targetGroups = formData.getAll('targetGroups') as string[];

  // Hash SSN — never store plaintext
  const rawSsn = formData.get('ssn') as string;
  const ssnData = rawSsn ? prepareSSNForStorage(rawSsn) : { ssn_hash: '', ssn_last4: '' };
  
  const applicationData = {
    employee_first_name: formData.get('firstName') as string,
    employee_last_name: formData.get('lastName') as string,
    employee_ssn_hash: ssnData.ssn_hash,
    employee_ssn_last4: ssnData.ssn_last4,
    employee_dob: formData.get('dob') as string,
    employer_name: formData.get('employerName') as string,
    employer_ein: formData.get('ein') as string,
    employer_phone: formData.get('employerPhone') as string || null,
    job_offer_date: formData.get('offerDate') as string,
    start_date: formData.get('startDate') as string,
    starting_wage: parseFloat(formData.get('wage') as string) || null,
    position: formData.get('position') as string,
    target_groups: targetGroups,
    status: formData.get('saveAsDraft') ? 'draft' : 'submitted',
    submitted_by: user.id,
    submitted_at: formData.get('saveAsDraft') ? null : new Date().toISOString(),
  };

  const { data, error } = await db
    .from('wotc_applications')
    .insert(applicationData)
    .select()
    .single();

  if (error) {
    // Log without exposing sensitive data
    console.error('WOTC insert error:', error?.message || 'unknown');
    return { error: 'Operation failed' };
  }

  await logAdminAudit({
    action: AdminAction.WOTC_APPLICATION_CREATED,
    actorId: user.id,
    entityType: 'wotc_applications',
    entityId: data.id,
    metadata: { employer_name: applicationData.employer_name, ssn_last4: ssnData.ssn_last4 },
  });

  revalidatePath('/admin/wotc');
  redirect('/admin/wotc');
}

export async function updateWOTCApplication(id: string, formData: FormData) {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Not authenticated' };
  }
  const { data: _p2 } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (!_p2 || !['admin', 'super_admin'].includes(_p2.role)) return { error: 'Forbidden' };

  const targetGroups = formData.getAll('targetGroups') as string[];

  // Hash SSN — never store plaintext
  const rawSsn = formData.get('ssn') as string;
  const ssnData = rawSsn ? prepareSSNForStorage(rawSsn) : { ssn_hash: '', ssn_last4: '' };
  
  const updateData = {
    employee_first_name: formData.get('firstName') as string,
    employee_last_name: formData.get('lastName') as string,
    employee_ssn_hash: ssnData.ssn_hash,
    employee_ssn_last4: ssnData.ssn_last4,
    employee_dob: formData.get('dob') as string,
    employer_name: formData.get('employerName') as string,
    employer_ein: formData.get('ein') as string,
    employer_phone: formData.get('employerPhone') as string || null,
    job_offer_date: formData.get('offerDate') as string,
    start_date: formData.get('startDate') as string,
    starting_wage: parseFloat(formData.get('wage') as string) || null,
    position: formData.get('position') as string,
    target_groups: targetGroups,
    updated_at: new Date().toISOString(),
  };

  const { error } = await db
    .from('wotc_applications')
    .update(updateData)
    .eq('id', id);

  if (error) {
    return { error: 'Operation failed' };
  }

  await logAdminAudit({
    action: AdminAction.WOTC_APPLICATION_UPDATED,
    actorId: user.id,
    entityType: 'wotc_applications',
    entityId: id,
    metadata: { employer_name: updateData.employer_name },
  });

  revalidatePath('/admin/wotc');
  revalidatePath(`/admin/wotc/${id}`);
  redirect('/admin/wotc');
}

export async function submitWOTCApplication(id: string) {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  
  const { error } = await db
    .from('wotc_applications')
    .update({ 
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    return { error: 'Operation failed' };
  }

  revalidatePath('/admin/wotc');
  return { success: true };
}

export async function updateWOTCStatus(id: string, status: string, notes?: string) {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  
  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'approved') {
    updateData.certification_date = new Date().toISOString();
  }

  if (notes) {
    updateData.reviewer_notes = notes;
  }

  const { error } = await db
    .from('wotc_applications')
    .update(updateData)
    .eq('id', id);

  if (error) {
    return { error: 'Operation failed' };
  }

  revalidatePath('/admin/wotc');
  revalidatePath(`/admin/wotc/${id}`);
  return { success: true };
}

export async function deleteWOTCApplication(id: string) {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await db
    .from('wotc_applications')
    .delete()
    .eq('id', id);

  if (error) {
    return { error: 'Operation failed' };
  }

  if (user) {
    await logAdminAudit({
      action: AdminAction.WOTC_APPLICATION_DELETED,
      actorId: user.id,
      entityType: 'wotc_applications',
      entityId: id,
      metadata: {},
    });
  }

  revalidatePath('/admin/wotc');
  redirect('/admin/wotc');
}
