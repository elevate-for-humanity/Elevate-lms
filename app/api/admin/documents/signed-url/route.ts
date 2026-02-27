import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { getAdminDocumentUrl } from '@/lib/admin/document-access';
import { logger } from '@/lib/logger';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Generate a short-lived signed URL for a document in a private bucket.
 * Admin-only — requires authenticated user with admin/super_admin role.
 *
 * Accepts either:
 *   ?id=<document_id>  — delegates to getAdminDocumentUrl (preferred)
 *   ?path=<file_path>&bucket=<bucket_name>  — direct path (legacy)
 *
 * Server-side resolution prevents client-supplied path enumeration.
 */
async function _GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'strict');
    if (rateLimited) return rateLimited;
    const supabase = await createClient();
    const admin = createAdminClient();
    const db = admin || supabase;

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role check — admin only
    const { data: profile } = await db
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const allowedRoles = ['admin', 'super_admin', 'org_admin'];
    if (!profile || !allowedRoles.includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('id');

    // Preferred path: delegate to centralized document access
    if (documentId) {
      const url = await getAdminDocumentUrl({
        adminId: user.id,
        documentId,
        context: 'api_endpoint',
      });

      if (!url) {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 });
      }

      return NextResponse.json({ url });
    }

    // Legacy ?path= flow — kept for backward compatibility
    const filePath = searchParams.get('path');
    const bucket = searchParams.get('bucket') || 'documents';

    if (!filePath) {
      return NextResponse.json({ error: 'Missing id or path parameter' }, { status: 400 });
    }

    // Path traversal protection
    if (filePath.includes('..') || filePath.startsWith('/')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    // Legacy path must match an existing document row
    const { data: matchingDoc } = await db
      .from('documents')
      .select('id, user_id, document_type')
      .eq('file_path', filePath)
      .single();

    if (!matchingDoc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Allowlist of buckets admins can access
    const allowedBuckets = [
      'documents',
      'enrollment-documents',
      'program-holder-documents',
      'apprentice-uploads',
      'tax-documents',
    ];
    if (!allowedBuckets.includes(bucket)) {
      return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 });
    }

    const { data, error } = await db.storage
      .from(bucket)
      .createSignedUrl(filePath, 60);

    if (error || !data?.signedUrl) {
      return NextResponse.json({ error: 'Failed to generate URL' }, { status: 500 });
    }

    // Audit the legacy path access
    await db.from('admin_audit_events').insert({
      actor_user_id: user.id,
      action: 'DOCUMENT_URL_ISSUED',
      target_type: 'document',
      target_id: matchingDoc.id,
      metadata: {
        bucket,
        admin_role: profile.role,
        document_owner_id: matchingDoc.user_id,
        document_type: matchingDoc.document_type,
        file_path: filePath,
        resolution: 'client_path',
      },
    }).then(null, (err: Error) => {
      logger.warn('[SignedURL] Audit log insert failed', { error: err.message });
    });

    return NextResponse.json({ url: data.signedUrl });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/admin/documents/signed-url', _GET);
