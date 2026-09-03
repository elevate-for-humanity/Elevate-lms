import { NextRequest, NextResponse } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeInternalError } from '@/lib/api/safe-error';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  const query = request.nextUrl.searchParams.get('query')?.trim().slice(0, 120) ?? '';
  if (!query) {
    return NextResponse.json({ error: 'query is required' }, { status: 400 });
  }

  const db = await requireAdminClient();
  const { data, error } = await db
    .from('team_members')
    .select('name,title,org_role,bio')
    .eq('is_active', true)
    .or(`name.ilike.%${query.replace(/[%,]/g, '')}%,title.ilike.%${query.replace(/[%,]/g, '')}%`)
    .order('display_order', { ascending: true })
    .limit(5);

  if (error) return safeInternalError(error, 'Failed to search the organization directory');

  return NextResponse.json({
    source: 'approved organization directory',
    members: data ?? [],
  });
}
