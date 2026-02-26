import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Generate a short-lived signed URL for a document in a private bucket.
 * Admin-only — requires authenticated user with admin/super_admin role.
 *
 * Accepts either:
 *   ?id=<document_id>  — resolves path server-side (preferred)
 *   ?path=<file_path>&bucket=<bucket_name>  — direct path (legacy)
 *
 * Server-side resolution prevents client-supplied path enumeration.
 */
export async function GET(request: NextRequest) {
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
    let filePath = searchParams.get('path');
    let bucket = searchParams.get('bucket') || 'documents';
    let documentOwnerId: string | null = null;
    let documentType: string | null = null;

    // Preferred: resolve path from document ID server-side
    if (documentId) {
      const { data: doc } = await db
        .from('documents')
        .select('file_path, user_id, document_type')
        .eq('id', documentId)
        .single();

      if (!doc?.file_path) {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 });
      }

      filePath = doc.file_path;
      documentOwnerId = doc.user_id;
      documentType = doc.document_type;
      bucket = 'documents';
    }

    if (!filePath) {
      return NextResponse.json({ error: 'Missing id or path parameter' }, { status: 400 });
    }

    // Path traversal protection (for legacy path parameter)
    if (filePath.includes('..') || filePath.startsWith('/')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
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

    // Extract owner from path if not already known (format: user_id/filename)
    if (!documentOwnerId) {
      const pathSegments = filePath.split('/');
      documentOwnerId = pathSegments.length > 1 ? pathSegments[0] : null;
    }

    // Log document access to immutable audit trail
    await db.from('admin_audit_events').insert({
      actor_id: user.id,
      action: 'DOCUMENT_VIEWED',
      entity_type: 'document',
      entity_id: documentId || filePath,
      metadata: {
        bucket,
        admin_role: profile.role,
        document_owner_id: documentOwnerId,
        document_type: documentType,
        resolution: documentId ? 'server_side' : 'client_path',
      },
      created_at: new Date().toISOString(),
    }).then(null, (err: Error) => {
      logger.warn('[SignedURL] Audit log insert failed', { error: err.message });
    });

    return NextResponse.json({ url: data.signedUrl });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
