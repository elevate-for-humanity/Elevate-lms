import { NextRequest } from 'next/server';

import { buildCapabilityHealth } from '@/lib/devstudio/capability-health';
import { capabilityHealthResponse } from '@/lib/devstudio/health-response';
import { requireAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return capabilityHealthResponse(request, async () => {
    let tablePassed = false;
    let tableMessage = 'CFD project table is unavailable.';
    try {
      const db = await requireAdminClient();
      const { error } = await db.from('cfd_projects').select('id').limit(1);
      tablePassed = !error;
      tableMessage = error ? 'CFD project table query failed.' : 'CFD project table query succeeded.';
    } catch {
      tableMessage = 'CFD project table query failed.';
    }

    const featureEnabled = process.env.CFD_ENABLED === 'true';
    const containerConfigured = Boolean(process.env.STUDIO_SHELL_WS_URL && process.env.STUDIO_SHELL_SECRET && process.env.STUDIO_TOKEN_SECRET);
    const solverConfigured = Boolean(process.env.CFD_OPENFOAM_IMAGE);

    return buildCapabilityHealth('cfd', [
      { name: 'feature-flag', passed: featureEnabled, required: true, message: featureEnabled ? 'CFD is enabled.' : 'CFD_ENABLED is not true.' },
      { name: 'cfd-projects-table', passed: tablePassed, required: true, message: tableMessage },
      { name: 'container-runtime', passed: containerConfigured, required: true, message: containerConfigured ? 'Container runtime is configured.' : 'Studio shell container configuration is incomplete.' },
      { name: 'openfoam-image', passed: solverConfigured, required: true, message: solverConfigured ? 'OpenFOAM image is configured.' : 'CFD_OPENFOAM_IMAGE is missing.' },
    ]);
  });
}
