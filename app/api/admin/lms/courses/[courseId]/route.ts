import { type NextRequest } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest, context: { params: Promise<{ courseId: string }> }) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;
  
  const { courseId } = await context.params;
  const body = await request.json();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('courses')
    .update(body)
    .eq('id', courseId)
    .select()
    .single();
  
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ courseId: string }> }) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;
  
  const { courseId } = await context.params;
  const supabase = await createClient();
  const { error } = await supabase
    .from('courses')
    .update({ status: 'archived' })
    .eq('id', courseId);
  
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}
