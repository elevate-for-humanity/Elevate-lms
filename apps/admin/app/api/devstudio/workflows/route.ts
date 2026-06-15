import { NextRequest } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { buildCommandCenterSnapshot } from '@/lib/devstudio/os/command-center';
import { indexRepository, searchRepoIndex } from '@/lib/devstudio/os/repo-indexer';
import { jsonOk } from '@/lib/devstudio/os/api-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  const view = request.nextUrl.searchParams.get('view');

  try {
    const db = await requireAdminClient();

    if (view === 'repo-search') {
      const q = request.nextUrl.searchParams.get('q') ?? '';
      const results = await searchRepoIndex(db, q);
      return jsonOk({ results });
    }

    let health: Record<string, unknown> | null = null;
    try {
      const healthRes = await fetch(new URL('/api/devstudio/health', request.url), {
        headers: { cookie: request.headers.get('cookie') ?? '' },
      });
      if (healthRes.ok) health = await healthRes.json();
    } catch {
      health = null;
    }

    const snapshot = await buildCommandCenterSnapshot(db, { health });
    return jsonOk({ snapshot });
  } catch (err) {
    return safeInternalError(err, 'Failed to load command center');
  }
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json().catch(() => ({}));
    if (body.action === 'index-repo') {
      const db = await requireAdminClient();
      const result = await indexRepository(db, {
        maxFiles: typeof body.maxFiles === 'number' ? body.maxFiles : 400,
      });
      return jsonOk({ result });
    }

    return safeError('Unknown action', 400);
  } catch (err) {
    return safeInternalError(err, 'Workflow action failed');
  }
}
