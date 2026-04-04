'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { writeAdminAuditEvent, AuditActions } from '@/lib/audit';

export async function reviewDocument(docId: string, approved: boolean, notes?: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw new Error('Auth failed');
  if (!user) return { error: 'Not authenticated' };

  const db = createAdminClient();

  // Role check was missing — any authenticated user could approve documents.
  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
    return { error: 'Forbidden' };
  }

  // Confirm the document exists before mutating.
  const { data: record, error: fetchError } = await db
    .from('program_holder_documents')
    .select('id')
    .eq('id', docId)
    .single();

  if (fetchError || !record) return { error: 'Document not found' };

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
