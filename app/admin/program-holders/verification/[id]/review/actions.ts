'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { writeAdminAuditEvent, AuditActions } from '@/lib/audit';

const ADMIN_ROLES = ['admin', 'super_admin'];

// Valid status transitions for program_holders
const VALID_FROM_STATES = ['pending', 'submitted', 'under_review'];

export async function submitVerificationDecision(
  holderId: string,
  decision: 'approved' | 'rejected',
  notes?: string
) {
  // ── 1. AUTH ────────────────────────────────────────────────────────
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw new Error(`Auth failed: ${authError.message}`);
  if (!user) return { error: 'Not authenticated' };

  const db = createAdminClient();
  if (!db) return { error: 'Service unavailable' };

  // ── 2. ROLE CHECK ──────────────────────────────────────────────────
  const { data: actorProfile, error: actorError } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (actorError || !actorProfile) return { error: 'Forbidden' };
  if (!ADMIN_ROLES.includes(actorProfile.role)) return { error: 'Forbidden' };

  // ── 3. LOAD HOLDER — source of truth, not client input ────────────
  const { data: holder, error: holderError } = await db
    .from('program_holders')
    .select('id, user_id, status, primary_program_id')
    .eq('id', holderId)
    .single();

  if (holderError || !holder) return { error: 'Program holder not found' };

  // ── 4. STATE MACHINE — prevent re-approval / re-rejection ─────────
  const currentStatus = holder.status ?? 'pending';
  if (!VALID_FROM_STATES.includes(currentStatus)) {
    return { error: `Cannot transition from status "${currentStatus}"` };
  }

  // ── 5. WRITE HOLDER STATUS — use columns that actually exist ───────
  const { error: updateError } = await db
    .from('program_holders')
    .update({
      status: decision,
      approved_by: decision === 'approved' ? user.id : null,
      approved_at: decision === 'approved' ? new Date().toISOString() : null,
    })
    .eq('id', holderId);

  if (updateError) return { error: 'Failed to update verification status' };

  // ── 6. INSERT VERIFICATION RECORD ─────────────────────────────────
  await db.from('program_holder_verification').insert({
    program_holder_id: holderId,
    verified_by: user.id,
    status: decision,
    notes: notes ?? null,
  });

  // ── 7. ROLE PROMOTION — use holder.user_id from DB, never caller ──
  if (decision === 'approved' && holder.user_id) {
    const { error: roleError } = await db
      .from('profiles')
      .update({ role: 'program_holder', updated_at: new Date().toISOString() })
      .eq('id', holder.user_id);

    if (roleError) {
      // Role promotion failure must not silently succeed — log and surface
      return { error: 'Holder approved but role promotion failed. Contact engineering.' };
    }
  }

  // ── 8. AUDIT ───────────────────────────────────────────────────────
  await writeAdminAuditEvent(supabase, {
    action: AuditActions.PROGRAM_HOLDER_VERIFIED,
    target_type: 'program_holder',
    target_id: holderId,
    metadata: {
      decision,
      holder_user_id: holder.user_id,
      previous_status: currentStatus,
      program_id: holder.primary_program_id,
    },
  });

  return { success: true };
}
