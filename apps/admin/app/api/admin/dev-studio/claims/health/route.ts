import { NextRequest } from 'next/server';

import { buildCapabilityHealth } from '@/lib/devstudio/capability-health';
import { capabilityHealthResponse } from '@/lib/devstudio/health-response';
import { DEV_STUDIO_LANGUAGE_COUNT } from '@/lib/devstudio/language-registry';
import { requireAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return capabilityHealthResponse(request, async () => {
    const db = await requireAdminClient();
    const [{ error: claimsError }, { error: benchmarksError }] = await Promise.all([
      db.from('dev_studio_claim_evidence').select('id').limit(1),
      db.from('dev_studio_benchmarks').select('id').limit(1),
    ]);

    return buildCapabilityHealth('claims', [
      {
        name: 'claim-evidence-table',
        passed: !claimsError,
        required: true,
        message: claimsError ? 'Claim evidence table query failed.' : 'Claim evidence table is available.',
      },
      {
        name: 'benchmark-table',
        passed: !benchmarksError,
        required: true,
        message: benchmarksError ? 'Benchmark table query failed.' : 'Benchmark table is available.',
      },
      {
        name: 'language-claim-threshold',
        passed: DEV_STUDIO_LANGUAGE_COUNT >= 50,
        required: true,
        message: `${DEV_STUDIO_LANGUAGE_COUNT} maintained language modes are registered.`,
      },
    ]);
  });
}
