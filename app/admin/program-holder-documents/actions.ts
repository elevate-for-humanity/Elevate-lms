'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { writeAdminAuditEvent, AuditActions } from '@/lib/audit';

export async function reviewDocument(docId: string, approved: boolean, notes?: string) {
  const supabase = await createClient();
  const db = createAdminClient() || supabase;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await db
    .from('program_holder_documents')
    .update({
      approved,
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      approval_notes: notes || null,
    })
    .eq('id', docId);

  if (error) return { error: 'Failed to update document' };

  await writeAdminAuditEvent(supabase, {
    action: AuditActions.PROGRAM_HOLDER_DOC_REVIEWED,
    target_type: 'program_holder_document',
    target_id: docId,
    metadata: { approved },
  });

  return { success: true };
}
