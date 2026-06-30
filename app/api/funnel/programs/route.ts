// PUBLIC ROUTE: returns published programs for the eligibility check funnel
import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient } from '@/lib/supabase/public';
import { safeInternalError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  try {
    const db = createPublicClient();
    const { data, error } = await db
      .from('programs')
      .select(
        'id, slug, title, duration_weeks, salary_min, salary_max, credential_name, funding_eligible, wioa_approved, funding_tags, category',
      )
      .eq('published', true)
      .eq('is_active', true)
      .neq('status', 'archived')
      .order('title');

    if (error) return safeInternalError(error, 'Failed to load programs');

    return NextResponse.json({ programs: data ?? [] });
  } catch (err) {
    return safeInternalError(err as Error, 'Failed to load programs');
  }
}
