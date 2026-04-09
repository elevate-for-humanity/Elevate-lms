'use server';

import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
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

  // Admin client bypasses RLS on program_enrollments
  const db = await getAdminClient();
  if (!db) throw new Error('Admin client failed to initialize');
  return { supabase, db, adminId: user.id };
}

export async function verifyFunding(enrollmentId: string, note?: string) {
  const { db, adminId } = await requireAdmin();

  // Capture current state before mutation for structured audit trail
  const { data: current } = await db
    .from('program_enrollments')
    .select('enrollment_state, status')
    .eq('id', enrollmentId)
    .single();

  const { error } = await db
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

  // "resolved_admin_override" distinguishes human judgment from system auto-resolution.
  // This distinction matters when auditing fraud vs legitimate admin overrides.
  await db
    .from('payment_integrity_flags')
    .update({
      resolved_at: new Date().toISOString(),
      resolved_by: adminId,
      resolution_type: 'resolved_admin_override',
      resolution_note: note?.trim() || 'Funding verified by admin',
    })
    .eq('enrollment_id', enrollmentId)
    .is('resolved_at', null);

  await db.from('audit_logs').insert({
    actor_id: adminId,
    actor_role: 'admin',
    action: 'funding.verified',
    resource_type: 'enrollment',
    resource_id: enrollmentId,
    metadata: {
      previous_state: current?.enrollment_state ?? null,
      new_state: 'onboarding',
      previous_status: current?.status ?? null,
      new_status: 'active',
      note: note?.trim() || null,
      resolution_type: 'resolved_admin_override',
    },
  });

  revalidatePath('/admin/funding-verification');
}

export async function rejectFunding(enrollmentId: string, reason: string) {
  // Reason is required — no silent rejections. Admins must document why.
  if (!reason?.trim()) {
    throw new Error('A reason is required when rejecting funding verification.');
  }

  const { db, adminId } = await requireAdmin();

  const { data: current } = await db
    .from('program_enrollments')
    .select('enrollment_state, status')
    .eq('id', enrollmentId)
    .single();

  const { error } = await db
    .from('program_enrollments')
    .update({
      enrollment_state: 'revoked',
      status: 'revoked',
      revoked_at: new Date().toISOString(),
      revoked_by: adminId,
      revocation_reason: reason.trim(),
    })
    .eq('id', enrollmentId)
    .eq('enrollment_state', 'pending_funding_verification');

  if (error) throw new Error(`Failed to reject: ${error.message}`);

  await db
    .from('payment_integrity_flags')
    .update({
      resolved_at: new Date().toISOString(),
      resolved_by: adminId,
      resolution_type: 'resolved_admin_override',
      resolution_note: reason.trim(),
    })
    .eq('enrollment_id', enrollmentId)
    .is('resolved_at', null);

  await db.from('audit_logs').insert({
    actor_id: adminId,
    actor_role: 'admin',
    action: 'funding.rejected',
    resource_type: 'enrollment',
    resource_id: enrollmentId,
    metadata: {
      previous_state: current?.enrollment_state ?? null,
      new_state: 'revoked',
      previous_status: current?.status ?? null,
      new_status: 'revoked',
      reason: reason.trim(),
      resolution_type: 'resolved_admin_override',
    },
  });

  revalidatePath('/admin/funding-verification');
}
