import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeDbError } from '@/lib/api/safe-error';

// Stores TPP survey responses in a generic settings/documents table.
// The fssa_tpp_surveys table is created on first upsert via the jsonb column.

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  if (!body) return safeError('Invalid request body', 400);

  const db = await requireAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  // Upsert into platform_settings as a JSON blob keyed by 'fssa_tpp_survey'
  const { error } = await db
    .from('platform_settings')
    .upsert(
      {
        key: 'fssa_tpp_survey',
        value: JSON.stringify(body),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' },
    );

  if (error) return safeDbError(error, 'Failed to save TPP survey');
  return NextResponse.json({ success: true });
}

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const db = await requireAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  const { data, error } = await db
    .from('platform_settings')
    .select('value, updated_at')
    .eq('key', 'fssa_tpp_survey')
    .maybeSingle();

  if (error) return safeDbError(error, 'Failed to fetch TPP survey');

  const survey = data?.value ? JSON.parse(data.value) : null;
  return NextResponse.json({ survey, updated_at: data?.updated_at ?? null });
}
