export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function GET(req: NextRequest) {
  
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
const supabase = await createRouteHandlerClient({ cookies });

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Check role
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!profile || !['admin', 'partner'].includes(profile.role)) {
    return new Response('Forbidden', { status: 403 });
  }

  // Get query parameters
  const url = new URL(req.url);
  const program = url.searchParams.get('program') || 'ALL';
  const searchQuery = (url.searchParams.get('q') || '').toLowerCase();

  // Call the SQL function
  const { data, error }: any = await supabase.rpc('admin_list_applications', {
    pcode: program === 'ALL' ? null : program,
  });

  if (error) {
    logger.error('Error fetching applications:', error);
    return new Response(toErrorMessage(error), { status: 500 });
  }

  // Filter by search query
  const filtered = (data || []).filter((row: Record<string, any>) => {
    if (!searchQuery) return true;
    return (
      (row.learner_email || '').toLowerCase().includes(searchQuery) ||
      (row.course_title || '').toLowerCase().includes(searchQuery)
    );
  });

  return Response.json(filtered);
}
