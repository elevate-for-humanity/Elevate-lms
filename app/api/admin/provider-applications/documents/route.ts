/**
 * Fetch uploaded documents for a provider application.
 * GET ?applicationId=<uuid>
 */
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { getAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const applicationId = request.nextUrl.searchParams.get('applicationId');
  if (!applicationId) return safeError('applicationId required', 400);

  const supabase = await getAdminClient();
  if (!supabase) return safeInternalError(new Error('DB unavailable'), 'Failed to fetch documents');

  const { data, error } = await supabase
    .from('provider_application_documents')
    .select('*')
    .eq('application_id', applicationId)
    .order('uploaded_at', { ascending: true });

  if (error) return safeInternalError(error, 'Failed to fetch documents');

  return NextResponse.json({ documents: data ?? [] });
}
