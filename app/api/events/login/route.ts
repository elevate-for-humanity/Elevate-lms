import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  const supabase = await createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const body = await req.json().catch((err) => {
    logger.error('Failed to parse request body:', err);
    return {};
  });
  const source = body.source || 'LMS_DASHBOARD';

  await supabase.from('login_events').insert({
    user_id: user.id,
    source,
  });

  return Response.json({ ok: true });
}
