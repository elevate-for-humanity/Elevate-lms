/**
 * GET /api/admin/enrollments/[id]/documents
 *
 * Returns all documents uploaded by the student on this enrollment,
 * with signed URLs (60 min) and OCR text from metadata.
 *
 * Requires admin, super_admin, or staff role.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return safeError('Unauthorized', 401);

  const db = createAdminClient();
  const { data: adminProfile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!adminProfile || !['admin', 'super_admin', 'staff'].includes(adminProfile.role)) {
    return safeError('Forbidden', 403);
  }

  const { id: enrollmentId } = await params;

  // Get enrollment to find user_id
  const { data: enrollment, error: enrollErr } = await db
    .from('program_enrollments')
    .select('user_id, program_slug')
    .eq('id', enrollmentId)
    .single();

  if (enrollErr || !enrollment) return safeError('Enrollment not found', 404);

  // Fetch all documents for this user
  const { data: docs, error: docsErr } = await db
    .from('documents')
    .select('id, document_type, file_name, file_path, file_url, mime_type, status, verification_status, metadata, created_at, title')
    .eq('user_id', enrollment.user_id)
    .order('created_at', { ascending: false });

  if (docsErr) return safeInternalError(docsErr, 'Failed to fetch documents');

  // Generate signed URLs for each document
  const withUrls = await Promise.all(
    (docs || []).map(async (doc) => {
      let signedUrl = doc.file_url || null;

      if (doc.file_path) {
        const { data: signed } = await db.storage
          .from('documents')
          .createSignedUrl(doc.file_path, 3600); // 1 hour
        if (signed?.signedUrl) signedUrl = signed.signedUrl;
      }

      // Extract OCR text from metadata
      const ocrText = doc.metadata?.ocr_text
        || doc.metadata?.extracted_text
        || doc.metadata?.text
        || null;

      return {
        id: doc.id,
        document_type: doc.document_type,
        title: doc.title || doc.file_name || doc.document_type,
        file_name: doc.file_name,
        mime_type: doc.mime_type,
        status: doc.status,
        verification_status: doc.verification_status,
        signed_url: signedUrl,
        ocr_text: ocrText,
        uploaded_at: doc.created_at,
      };
    })
  );

  return NextResponse.json({ documents: withUrls });
}
