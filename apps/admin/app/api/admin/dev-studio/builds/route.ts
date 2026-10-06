// pre-auth-registry: exempt - Dev Studio auth gates deployment ledger access.
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError } from '@/lib/api/safe-error';
import { getGitHubToken } from '@/lib/devstudio/github-token';

// Reuse the canonical Google dispatcher and its guards. A health probe is not a deployment.
export { POST } from '../services/route';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;
  const db = await requireAdminClient();
  const { data, error } = await db.from('ai_deployments').select('*')
    .order('started_at', { ascending: false }).limit(20);
  if (error) return safeError('Failed to fetch Dev Studio builds', 500);
  return NextResponse.json({ builds: data, provider: 'google-cloud',
    googleConfigured: Boolean(await getGitHubToken()) });
}
