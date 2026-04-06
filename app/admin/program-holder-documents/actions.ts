'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { writeAdminAuditEvent, AuditActions } from '@/lib/audit';

const ADMIN_ROLES = ['admin', 'super_admin', 'staff'];

export async function reviewDocument(docId: string, approved: boolean, notes?: string) {
  // ── 1. AUTH ────────────────────────────────────────────────────────
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw new Error('Auth failed');
  if (!user) return { error: 'Not authenticated' };

  const db = createAdminClient();
  if (!db) return { error: 'Service unavailable' };

  // ── 2. ROLE CHECK ──────────────────────────────────────────────────
  const { data: profile, error: profileError } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) return { error: 'Forbidden' };
  if (!ADMIN_ROLES.includes(profile.role)) return { error: 'Forbidden' };

  // ── 3. LOAD DOCUMENT — verify it exists before mutating ───────────
  const { data: doc, error: fetchError } = await db
    .from('program_holder_documents')
    .select('id, user_id, status, approved')
    .eq('id', docId)
    .single();

  if (fetchError || !doc) return { error: 'Document not found' };

  // ── 4. STATE MACHINE — no re-review of already-decided docs ───────
  if (doc.approved !== null) {
    return { error: 'Document has already been reviewed' };
  }

  // ── 5. WRITE — scoped to the verified doc id ──────────────────────
  const { error: updateError } = await db
    .from('program_holder_documents')
    .update({
      approved,
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      approval_notes: notes ?? null,
      status: approved ? 'approved' : 'rejected',
      updated_at: new Date().toISOString(),
    })
    .eq('id', docId);

  if (updateError) return { error: 'Failed to update document' };

  // ── 6. AUDIT ───────────────────────────────────────────────────────
  await writeAdminAuditEvent(supabase, {
    action: AuditActions.PROGRAM_HOLDER_DOC_REVIEWED,
    target_type: 'program_holder_document',
    target_id: docId,
    metadata: { approved, doc_owner_user_id: doc.user_id },
  });

  return { success: true };
}
