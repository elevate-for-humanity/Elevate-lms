import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';

// Enrollment is the assignment authority. Application/roster history must
// never redirect a learner to a former or merely prospective program holder.
export async function loadLearnerProgramContact(db: SupabaseClient, userId: string) {
  const { data: enrollments, error } = await db
    .from('program_enrollments')
    .select('program_holder_id')
    .or(`user_id.eq.${userId},student_id.eq.${userId}`)
    .in('status', ['active', 'enrolled', 'in_progress', 'confirmed']);
  if (error) throw error;
  const ids = [...new Set((enrollments || []).map((row) => row.program_holder_id).filter(Boolean))];
  if (!ids.length) return 'admissions@elevateforhumanity.org';
  const { data: holders, error: holderError } = await db
    .from('program_holders')
    .select('id')
    .in('id', ids)
    .eq('status', 'active');
  if (holderError) throw holderError;
  const activeIds = (holders || []).map((holder) => holder.id);
  if (!activeIds.length) return 'admissions@elevateforhumanity.org';
  const { data: boxes, error: mailboxError } = await db
    .from('communication_email_mailboxes')
    .select('address')
    .in('program_holder_id', activeIds)
    .eq('active', true)
    .eq('mailbox_kind', 'program_holder');
  if (mailboxError) throw mailboxError;
  const addresses = [...new Set((boxes || []).map((box) => box.address).filter(Boolean))];
  // Multiple current programs may have different contacts. Do not guess.
  return addresses.length === 1 ? addresses[0] : 'admissions@elevateforhumanity.org';
}
