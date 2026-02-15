import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 60;
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
const path = new URL(req.url).searchParams.get('path');

  if (!path) {
    return Response.json({ error: 'No path provided' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error }: any = await supabase.storage
    .from('media')
    .createSignedUrl(path, 3600);

  if (error) {
    return Response.json({ error: toErrorMessage(error) }, { status: 500 });
  }

  return Response.json(data);
}
