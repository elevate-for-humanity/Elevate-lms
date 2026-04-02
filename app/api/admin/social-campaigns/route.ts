import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authGuards';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeDbError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  await requireAdmin();
  const db = createAdminClient();
  const { data, error } = await db.from('social_campaigns').select('*').order('updated_at', { ascending: false });
  if (error) return safeDbError(error, 'Failed to fetch campaigns');
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;
  await requireAdmin();
  const db = createAdminClient();
  const body = await request.json().catch(() => null);
  if (!body?.name || !body?.platform) {
    return NextResponse.json({ error: 'name and platform are required' }, { status: 400 });
  }
  const { data, error } = await db
    .from('social_campaigns')
    .insert({
      name: body.name,
      platform: body.platform,
      status: body.status ?? 'draft',
      scheduled_posts: body.scheduled_posts ?? 0,
      start_date: body.start_date ?? null,
      end_date: body.end_date ?? null,
      metadata: body.metadata ?? {},
    })
    .select()
    .single();
  if (error) return safeDbError(error, 'Failed to create campaign');
  return NextResponse.json({ data }, { status: 201 });
}
