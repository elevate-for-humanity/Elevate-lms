import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeDbError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'api');
  if (limited) return limited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json();
  if (!body.title) return safeError('title required', 400);

  const db = await requireAdminClient();

  const { data, error } = await db
    .from('grant_opportunities')
    .insert({
      source: body.source ?? 'sam_gov',
      opportunity_number: body.opportunity_number ?? null,
      title: body.title,
      agency_name: body.agency_name ?? null,
      cfda_number: body.cfda_number ?? null,
      posted_date: body.posted_date ?? null,
      close_date: body.close_date ?? null,
      award_ceiling: body.award_ceiling ?? null,
      award_floor: body.award_floor ?? null,
      opportunity_url: body.opportunity_url ?? null,
      description: body.description ?? null,
      eligibility_text: body.eligibility_text ?? null,
      status: body.status ?? 'posted',
      raw_json: body.raw_json ?? null,
    })
    .select()
    .single();

  if (error) return safeDbError(error, 'Failed to save opportunity');
  return NextResponse.json({ opportunity: data });
}

export async function GET(request: NextRequest) {
  const limited = await applyRateLimit(request, 'api');
  if (limited) return limited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const db = await requireAdminClient();
  const { data, error } = await db
    .from('grant_opportunities')
    .select('*')
    .order('close_date', { ascending: true, nullsFirst: false })
    .limit(100);

  if (error) return safeDbError(error, 'Failed to fetch opportunities');
  return NextResponse.json({ opportunities: data });
}
