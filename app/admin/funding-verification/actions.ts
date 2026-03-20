'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
    throw new Error('Forbidden');
  }

  return { supabase, adminId: user.id };
}

export async function verifyFunding(enrollmentId: string, note?: string) {
  const { supabase, adminId } = await requireAdmin();

  const { error } = await supabase
    .from('program_enrollments')
    .update({
      enrollment_state: 'onboarding',
      status: 'active',
      funding_verified: true,
      funding_verified_at: new Date().toISOString(),
      funding_verified_by: adminId,
    })
    .eq('id', enrollmentId)
    .eq('enrollment_state', 'pending_funding_verification');

  if (error) throw new Error(`Failed to verify: ${error.message}`);

  // Resolve the open integrity flag
  await supabase
    .from('payment_integrity_flags')
    .update({
      resolved_at: new Date().toISOString(),
      resolved_by: adminId,
      resolution_note: note || 'Funding verified by admin',
    })
    .eq('enrollment_id', enrollmentId)
    .is('resolved_at', null);

  await supabase.from('audit_logs').insert({
    actor_id: adminId,
    actor_type: 'admin',
    action: 'funding.verified',
    resource_type: 'enrollment',
    resource_id: enrollmentId,
    metadata: { note: note || null },
  });

  revalidatePath('/admin/funding-verification');
}

export async function rejectFunding(enrollmentId: string, note?: string) {
  const { supabase, adminId } = await requireAdmin();

  const { error } = await supabase
    .from('program_enrollments')
    .update({
      enrollment_state: 'revoked',
      status: 'revoked',
      revoked_at: new Date().toISOString(),
      revoked_by: adminId,
      revocation_reason: note || 'Funding not verified',
    })
    .eq('id', enrollmentId)
    .eq('enrollment_state', 'pending_funding_verification');

  if (error) throw new Error(`Failed to reject: ${error.message}`);

  await supabase
    .from('payment_integrity_flags')
    .update({
      resolved_at: new Date().toISOString(),
      resolved_by: adminId,
      resolution_note: note || 'Funding rejected — enrollment revoked',
    })
    .eq('enrollment_id', enrollmentId)
    .is('resolved_at', null);

  await supabase.from('audit_logs').insert({
    actor_id: adminId,
    actor_type: 'admin',
    action: 'funding.rejected',
    resource_type: 'enrollment',
    resource_id: enrollmentId,
    metadata: { note: note || null },
  });

  revalidatePath('/admin/funding-verification');
}
