import { createClient } from '@/lib/supabase/server';

import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _GET(req: Request) {
  
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
const path = new URL(req.url).searchParams.get('path');

  if (!path) {
    return Response.json({ error: 'No path provided' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error }: any = await supabase.storage
    .from('media')
    .createSignedUrl(path, 300); // 5-minute expiry for media content

  if (error) {
    return Response.json({ error: toErrorMessage(error) }, { status: 500 });
  }

  return Response.json(data);
}
export const GET = withApiAudit('/api/media/url', _GET);
