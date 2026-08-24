import { NextRequest } from 'next/server';
import { buildCapabilityHealth } from '@/lib/devstudio/capability-health';
import { capabilityHealthResponse } from '@/lib/devstudio/health-response';
import { requireAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return capabilityHealthResponse(request, async () => {
    const configured = Boolean(
      (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)
      && process.env.SUPABASE_SERVICE_ROLE_KEY,
    );
    let tableReady = false;
    if (configured) {
      const db = await requireAdminClient();
      const { error } = await db.from('studio_review_comments').select('id').limit(1);
      tableReady = !error;
    }
    return buildCapabilityHealth('collaboration', [
      {
        name: 'supabase-configuration',
        passed: configured,
        required: true,
        message: configured ? 'Supabase is configured.' : 'Supabase configuration is incomplete.',
      },
      {
        name: 'studio-review-comments',
        passed: tableReady,
        required: true,
        message: tableReady ? 'Canonical review comments are available.' : 'Canonical review comments are unavailable.',
      },
    ]);
  });
}
