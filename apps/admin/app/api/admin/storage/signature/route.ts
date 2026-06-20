import { requireAdmin } from '@/lib/auth';
import { NextRequest } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/with-auth';
import { logger } from '@/lib/logger';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { applyRateLimit } from '@/lib/api/withRateLimit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

const _GET = withAuth(
  async (req: NextRequest, context) => {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
    const { user } = context;
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const path = searchParams.get('path');

    if (!path) {
      return new Response('Path required', { status: 400 });
    }

    // Download from storage
    const { data, error }: any = await supabase.storage.from('agreements').download(path);

    if (error || !data) {
      logger.error('Download error:', error);
      return new Response('File not found', { status: 404 });
    }

    // Return image
    return new Response(data, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
      },
    });
  },
  { roles: ['admin', 'super_admin'] },
);
export const GET = withApiAudit('/api/admin/storage/signature', _GET);
