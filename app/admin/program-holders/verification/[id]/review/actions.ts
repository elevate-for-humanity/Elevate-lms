'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { writeAdminAuditEvent, AuditActions } from '@/lib/audit';

export async function submitVerificationDecision(
  holderId: string,
  holderUserId: string,
  decision: 'approved' | 'rejected',
  notes?: string
) {
  const supabase = await createClient();
  const db = createAdminClient() || supabase;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // Update program holder status
  const { error: holderError } = await db
    .from('program_holders')
    .update({
      verification_status: decision,
      verified_by: user.id,
      verified_at: new Date().toISOString(),
      verification_notes: notes || null,
    })
    .eq('id', holderId);

  if (holderError) return { error: 'Failed to update verification status' };

  // Insert verification record
  await db.from('program_holder_verification').insert({
    program_holder_id: holderId,
    verified_by: user.id,
    status: decision,
    notes: notes || null,
  });

  // Update profile if approved
  if (decision === 'approved') {
    await db.from('profiles')
      .update({ role: 'program_holder', updated_at: new Date().toISOString() })
      .eq('id', holderUserId);
  }

  await writeAdminAuditEvent(supabase, {
    action: AuditActions.PROGRAM_HOLDER_VERIFIED,
    target_type: 'program_holder',
    target_id: holderId,
    metadata: { decision, holder_user_id: holderUserId },
  });

  return { success: true };
}
