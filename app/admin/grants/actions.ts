'use server';

import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { logAdminAudit, AdminAction, BULK_ENTITY_ID } from '@/lib/admin/audit-log';
import { logger } from '@/lib/logger';

export async function createGrantOpportunity(formData: FormData) {
  const supabase = await createClient();
  const db = await getAdminClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Not authenticated' };
  }
  const { data: _p } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (!_p || !['admin', 'super_admin'].includes(_p.role)) return { error: 'Forbidden' };

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

  const { data, error } = await db
    .from('grant_opportunities')
    .insert(grantData)
    .select()
    .single();

  if (error) {
    logger.error('Grant insert error:', error);
    return { error: 'Operation failed' };
  }

  await logAdminAudit({ action: AdminAction.GRANT_CREATED, actorId: user.id, entityType: 'grant_opportunities', entityId: data.id, metadata: { title: grantData.title } });

  revalidatePath('/admin/grants');
  redirect('/admin/grants');
}

export async function updateGrantOpportunity(id: string, formData: FormData) {
  const supabase = await createClient();
  const db = await getAdminClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };
  const { data: _p } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (!_p || !['admin', 'super_admin'].includes(_p.role)) return { error: 'Forbidden' };

  const { data: existing } = await db.from('grant_opportunities').select('id').eq('id', id).single();
  if (!existing) return { error: 'Grant not found' };

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

  const { error } = await db
    .from('grant_opportunities')
    .update(updateData)
    .eq('id', id);

  if (error) {
    return { error: 'Operation failed' };
  }

  await logAdminAudit({ action: AdminAction.GRANT_UPDATED, actorId: user.id, entityType: 'grant_opportunities', entityId: id, metadata: { title: updateData.title } });

  revalidatePath('/admin/grants');
  revalidatePath(`/admin/grants/${id}`);
  redirect('/admin/grants');
}

export async function deleteGrantOpportunity(id: string) {
  const supabase = await createClient();
  const db = await getAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };
  const { data: _p } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (!_p || !['admin', 'super_admin'].includes(_p.role)) return { error: 'Forbidden' };

  const { data: existing } = await db.from('grant_opportunities').select('id').eq('id', id).single();
  if (!existing) return { error: 'Grant not found' };

  const { error } = await db
    .from('grant_opportunities')
    .delete()
    .eq('id', id);

  if (error) {
    return { error: 'Operation failed' };
  }

  if (user) {
    await logAdminAudit({ action: AdminAction.GRANT_DELETED, actorId: user.id, entityType: 'grant_opportunities', entityId: id, metadata: {} });
  }

  revalidatePath('/admin/grants');
  redirect('/admin/grants');
}

export async function createGrantApplication(formData: FormData) {
  const supabase = await createClient();
  const db = await getAdminClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Not authenticated' };
  }
  const { data: _p } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (!_p || !['admin', 'super_admin'].includes(_p.role)) return { error: 'Forbidden' };

  const applicationData = {
    grant_id: formData.get('grantId') as string,
    submitted_by: user.id,
    amount_requested: parseFloat(formData.get('amountRequested') as string) || null,
    proposal_summary: formData.get('proposalSummary') as string,
    status: formData.get('saveAsDraft') ? 'draft' : 'submitted',
    submitted_at: formData.get('saveAsDraft') ? null : new Date().toISOString(),
  };

  const { data, error } = await db
    .from('grant_applications')
    .insert(applicationData)
    .select()
    .single();

  if (error) {
    logger.error('Grant application insert error:', error);
    return { error: 'Operation failed' };
  }

  await logAdminAudit({ action: AdminAction.GRANT_APPLICATION_CREATED, actorId: user.id, entityType: 'grant_applications', entityId: data.id, metadata: { grant_id: applicationData.grant_id, status: applicationData.status } });

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
  const db = await getAdminClient();

  const { data: existing } = await db.from('grant_applications').select('id').eq('id', id).single();
  if (!existing) return { error: 'Grant application not found' };

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

  const { error } = await db
    .from('grant_applications')
    .update(updateData)
    .eq('id', id);

  if (error) {
    return { error: 'Operation failed' };
  }

  const supabase2 = await createClient();
  const { data: { user: reviewer } } = await supabase2.auth.getUser();
  if (reviewer) {
    await logAdminAudit({ action: AdminAction.GRANT_APPLICATION_UPDATED, actorId: reviewer.id, entityType: 'grant_applications', entityId: id, metadata: { new_status: status, amount_awarded: amountAwarded } });
  }

  revalidatePath('/admin/grants');
  return { success: true };
}
