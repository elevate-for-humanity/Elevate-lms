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
 * GET /api/admin/documents/signed-url?path=<file_path>&bucket=<bucket_name>
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
    const filePath = searchParams.get('path');
    const bucket = searchParams.get('bucket') || 'documents';

    if (!filePath) {
      return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 });
    }

    // Path traversal protection
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
      .createSignedUrl(filePath, 60); // 60-second expiry for PII documents

    if (error || !data?.signedUrl) {
      return NextResponse.json({ error: 'Failed to generate URL' }, { status: 500 });
    }

    // Log document access to immutable audit trail
    // Extract document owner from file path (format: user_id/filename)
    const pathSegments = filePath.split('/');
    const documentOwnerId = pathSegments.length > 1 ? pathSegments[0] : null;

    await db.from('admin_audit_events').insert({
      actor_id: user.id,
      action: 'DOCUMENT_VIEWED',
      entity_type: 'document',
      entity_id: filePath,
      metadata: {
        bucket,
        admin_role: profile.role,
        document_owner_id: documentOwnerId,
      },
      created_at: new Date().toISOString(),
    }).then(null, (err: Error) => {
      // Non-blocking — don't fail the request if audit logging fails
      logger.warn('[SignedURL] Audit log insert failed', { error: err.message });
    });

    return NextResponse.json({ url: data.signedUrl });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
