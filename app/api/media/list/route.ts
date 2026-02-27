export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { createClient } from '@/lib/supabase/server';
import { toErrorMessage } from '@/lib/safe';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

// Allowed bucket names (whitelist)
const ALLOWED_BUCKETS = ['media', 'documents', 'avatars', 'course-content'];

// Safe folder pattern
const SAFE_FOLDER_PATTERN = /^[a-zA-Z0-9_-]*$/;

async function _GET(req: Request) {
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

    // Parse query parameters
    const url = new URL(req.url);
    const bucket = url.searchParams.get('bucket') || 'media';
    const folder = url.searchParams.get('folder') || '';

    // Validate bucket (whitelist)
    if (!ALLOWED_BUCKETS.includes(bucket)) {
      return Response.json(
        { error: 'Invalid storage bucket' },
        { status: 400 }
      );
    }

    // Validate folder to prevent path traversal
    if (folder && (!SAFE_FOLDER_PATTERN.test(folder) || folder.includes('..'))) {
      return Response.json(
        { error: 'Invalid folder name' },
        { status: 400 }
      );
    }

    const { data, error }: any = await supabase.storage
      .from(bucket)
      .list(folder, { 
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      logger.error('List error:', error);
      return Response.json({ error: toErrorMessage(error) }, { status: 500 });
    }

    return Response.json(data ?? []);
  } catch (error) {
    logger.error('List error:', error instanceof Error ? error : new Error(String(error)));
    return Response.json(
      { error: 'Failed to list files' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/media/list', _GET);
