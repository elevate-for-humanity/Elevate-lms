import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@/lib/auth';
import { toErrorMessage } from '@/lib/safe';

export async function POST(req: NextRequest) {
  const supabase = await createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const { data: prof } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (prof?.role !== 'admin') return new Response('Forbidden', { status: 403 });

  const { id, field, value } = await req.json();

  if (!id || !field) {
    return new Response('Missing fields', { status: 400 });
  }

  const { error } = await supabase
    .from('delegates')
    .update({ [field]: value })
    .eq('id', id);

  if (error) {
    return new Response(toErrorMessage(error), { status: 500 });
  }

  return Response.json({ ok: true });
}
