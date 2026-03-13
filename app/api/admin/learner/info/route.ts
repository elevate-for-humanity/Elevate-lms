export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest } from 'next/server';
import { getUserById } from '@/lib/supabase/admin';
import { withAuth } from '@/lib/with-auth';
import { logger } from '@/lib/logger';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function getHandler(
  req: NextRequest,
  context: {
    params: Promise<Record<string, string>>;
    user: Record<string, any>;
  }
) {
  const user = context.user;
  const url = new URL(req.url);
  const user_id = url.searchParams.get('user_id');

  if (!user_id) {
    return new Response('Missing user_id', { status: 400 });
  }

  try {
    const userData = await getUserById(user_id);

    if (!userData) {
      return new Response('User not found', { status: 404 });
    }

    return Response.json({
      id: userData.id,
      email: userData.email,
    });
  } catch (error) { 
    logger.error('Error fetching user:', error);
    return new Response('Failed to fetch user', { status: 500 });
  }
}

const _GET = withAuth(getHandler, {
  roles: ['admin', 'super_admin'],
});
export const GET = withApiAudit('/api/admin/learner/info', _GET);
