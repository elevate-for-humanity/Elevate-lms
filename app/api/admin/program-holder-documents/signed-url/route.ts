import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { writeAdminAuditEvent, AuditActions } from '@/lib/audit';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ADMIN_ROLES = ['admin', 'super_admin', 'staff'];

/**
 * POST /api/admin/program-holder-documents/signed-url
 * Body: { filePath: string }
 *
 * Generates a 1-hour signed URL for a file in the program_holder_documents
 * private storage bucket. Admin-only. Audited.
 */
export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = await getAdminClient();
  if (!db) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !ADMIN_ROLES.includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { filePath } = await req.json();
  if (!filePath || typeof filePath !== 'string') {
    return NextResponse.json({ error: 'filePath is required' }, { status: 400 });
  }

  // Look up document record for audit
  const { data: doc } = await db
    .from('program_holder_documents')
    .select('id, user_id')
    .eq('file_url', filePath)
    .maybeSingle();

  const { data, error } = await db.storage
    .from('program_holder_documents')
    .createSignedUrl(filePath, 3600);

  if (error || !data?.signedUrl) {
    logger.error('[signed-url] storage.createSignedUrl failed:', error);
    return NextResponse.json({ error: 'Could not generate URL' }, { status: 500 });
  }

  // Audit the access
  if (doc?.id) {
    await writeAdminAuditEvent(supabase, {
      action: AuditActions.PROGRAM_HOLDER_DOC_REVIEWED,
      target_type: 'program_holder_document',
      target_id: doc.id,
      metadata: { action: 'url_issued', owner_user_id: doc.user_id },
    }).catch(() => {});
  }

  return NextResponse.json({ url: data.signedUrl });
}
