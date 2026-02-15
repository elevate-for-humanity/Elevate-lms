export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@/lib/auth';
import { withAuth } from '@/lib/with-auth';
import { toErrorMessage } from '@/lib/safe';

async function getHandler(
  req: NextRequest,
  context: {
    params: Promise<Record<string, string>>;
    user: Record<string, any>;
  }
) {
  const user = context.user;
  const supabase = await createRouteHandlerClient({ cookies });
  const url = new URL(req.url);
  const learner_id = url.searchParams.get('user_id');

  if (!learner_id) {
    return new Response('Missing user_id', { status: 400 });
  }

  const { data: notes, error } = await supabase
    .from('program_holder_notes')
    .select(
      `
      user_id,
      course_id,
      program_holder_id,
      status,
      note,
      created_at,
      created_by,
      course:course_id(title),
      program_holder:program_holder_id(name),
      creator:created_by(email)
    `
    )
    .eq('user_id', learner_id)
    .order('created_at', { ascending: false });

  if (error) return new Response(toErrorMessage(error), { status: 500 });

  const mapped = (notes || []).map((n: Record<string, any>) => ({
    user_id: n.user_id,
    course_id: n.course_id,
    course_title: (n.course as { title?: string } | null)?.title || 'Unknown Course',
    program_holder: (n.program_holder as { name?: string } | null)?.name || 'Unknown',
    status: n.status,
    note: n.note,
    created_at: n.created_at,
    created_by_email: (n.creator as { email?: string } | null)?.email || 'Unknown',
  }));

  return Response.json(mapped);
}

export const GET = withAuth(getHandler, {
  roles: ['admin', 'super_admin'],
});
