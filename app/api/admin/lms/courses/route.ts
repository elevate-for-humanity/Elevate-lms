import { type NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  
  const body = await request.json();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('courses')
    .insert({ ...body, status: 'draft' })
    .select()
    .single();
  
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
