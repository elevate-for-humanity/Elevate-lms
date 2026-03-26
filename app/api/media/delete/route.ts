import { createClient } from "@/lib/supabase/server";


import { toErrorMessage } from '@/lib/safe';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { auditLog, AuditAction, AuditEntity } from '@/lib/logging/auditLog';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

// Allowed bucket names (whitelist)
const ALLOWED_BUCKETS = ['media', 'documents', 'avatars', 'course-content'];

// Safe path pattern - no path traversal
const SAFE_PATH_PATTERN = /^[a-zA-Z0-9_/-]+\.[a-zA-Z0-9]+$/;

export async function POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();

    // Authentication check
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check admin role for delete operations
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return Response.json(
        { error: 'Admin access required for delete operations' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { path, bucket = 'media' } = body;

    if (!path) {
      return Response.json({ error: "No path provided" }, { status: 400 });
    }

    // Validate bucket (whitelist)
    if (!ALLOWED_BUCKETS.includes(bucket)) {
      return Response.json(
        { error: 'Invalid storage bucket' },
        { status: 400 }
      );
    }

    // Validate path to prevent path traversal
    if (!SAFE_PATH_PATTERN.test(path) || path.includes('..')) {
      return Response.json(
        { error: 'Invalid file path' },
        { status: 400 }
      );
    }

    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      logger.error('Delete error:', error);
      return Response.json({ error: toErrorMessage(error) }, { status: 500 });
    }

    // Audit: log file deletion
    await auditLog({
      actorId: user.id,
      action: AuditAction.DOCUMENT_DELETED,
      entity: AuditEntity.DOCUMENT,
      entityId: path,
      metadata: { bucket, reason: 'user_initiated' },
    });

    return Response.json({ ok: true });
  } catch (error) {
    logger.error('Delete error:', error instanceof Error ? error : new Error(String(error)));
    return Response.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
