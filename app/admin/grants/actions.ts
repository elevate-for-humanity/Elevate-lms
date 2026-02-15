'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createGrantOpportunity(formData: FormData) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Not authenticated' };
  }

  const focusAreas = (formData.get('focusAreas') as string)
    ?.split(',')
    .map(s => s.trim())
    .filter(Boolean) || [];

  const grantData = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    funder: formData.get('funder') as string,
    amount_min: parseFloat(formData.get('amountMin') as string) || null,
    amount_max: parseFloat(formData.get('amountMax') as string) || null,
    deadline: formData.get('deadline') as string || null,
    application_url: formData.get('applicationUrl') as string || null,
    focus_areas: focusAreas,
    status: formData.get('status') as string || 'open',
    eligibility_criteria: formData.get('eligibility') ? {
      requirements: (formData.get('eligibility') as string).split('\n').filter(Boolean)
    } : null,
  };

  const { data, error } = await supabase
    .from('grant_opportunities')
    .insert(grantData)
    .select()
    .single();

  if (error) {
    console.error('Grant insert error:', error);
    return { error: 'Operation failed' };
  }

  revalidatePath('/admin/grants');
  redirect('/admin/grants');
}

export async function updateGrantOpportunity(id: string, formData: FormData) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Not authenticated' };
  }

  const focusAreas = (formData.get('focusAreas') as string)
    ?.split(',')
    .map(s => s.trim())
    .filter(Boolean) || [];

  const updateData = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    funder: formData.get('funder') as string,
    amount_min: parseFloat(formData.get('amountMin') as string) || null,
    amount_max: parseFloat(formData.get('amountMax') as string) || null,
    deadline: formData.get('deadline') as string || null,
    application_url: formData.get('applicationUrl') as string || null,
    focus_areas: focusAreas,
    status: formData.get('status') as string || 'open',
    eligibility_criteria: formData.get('eligibility') ? {
      requirements: (formData.get('eligibility') as string).split('\n').filter(Boolean)
    } : null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('grant_opportunities')
    .update(updateData)
    .eq('id', id);

  if (error) {
    return { error: 'Operation failed' };
  }

  revalidatePath('/admin/grants');
  revalidatePath(`/admin/grants/${id}`);
  redirect('/admin/grants');
}

export async function deleteGrantOpportunity(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('grant_opportunities')
    .delete()
    .eq('id', id);

  if (error) {
    return { error: 'Operation failed' };
  }

  revalidatePath('/admin/grants');
  redirect('/admin/grants');
}

export async function createGrantApplication(formData: FormData) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Not authenticated' };
  }

  const applicationData = {
    grant_id: formData.get('grantId') as string,
    submitted_by: user.id,
    amount_requested: parseFloat(formData.get('amountRequested') as string) || null,
    proposal_summary: formData.get('proposalSummary') as string,
    status: formData.get('saveAsDraft') ? 'draft' : 'submitted',
    submitted_at: formData.get('saveAsDraft') ? null : new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('grant_applications')
    .insert(applicationData)
    .select()
    .single();

  if (error) {
    console.error('Grant application insert error:', error);
    return { error: 'Operation failed' };
  }

  revalidatePath('/admin/grants');
  redirect('/admin/grants');
}

export async function updateGrantApplicationStatus(
  id: string, 
  status: string, 
  amountAwarded?: number,
  reviewerNotes?: string
) {
  const supabase = await createClient();
  
  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'approved' && amountAwarded) {
    updateData.amount_awarded = amountAwarded;
  }

  if (reviewerNotes) {
    updateData.reviewer_notes = reviewerNotes;
  }

  if (['approved', 'denied'].includes(status)) {
    updateData.reviewed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('grant_applications')
    .update(updateData)
    .eq('id', id);

  if (error) {
    return { error: 'Operation failed' };
  }

  revalidatePath('/admin/grants');
  return { success: true };
}
