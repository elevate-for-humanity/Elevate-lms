'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createWOTCApplication(formData: FormData) {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Get target groups as array
  const targetGroups = formData.getAll('targetGroups') as string[];
  
  const applicationData = {
    employee_first_name: formData.get('firstName') as string,
    employee_last_name: formData.get('lastName') as string,
    employee_ssn: formData.get('ssn') as string,
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
    console.error('WOTC insert error:', error);
    return { error: 'Operation failed' };
  }

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

  const targetGroups = formData.getAll('targetGroups') as string[];
  
  const updateData = {
    employee_first_name: formData.get('firstName') as string,
    employee_last_name: formData.get('lastName') as string,
    employee_ssn: formData.get('ssn') as string,
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
  
  const { error } = await db
    .from('wotc_applications')
    .delete()
    .eq('id', id);

  if (error) {
    return { error: 'Operation failed' };
  }

  revalidatePath('/admin/wotc');
  redirect('/admin/wotc');
}
