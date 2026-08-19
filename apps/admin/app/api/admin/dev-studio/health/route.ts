import { NextRequest } from 'next/server';

import { handleDevStudioHealth } from '@/lib/devstudio/health-handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Canonical Admin-owned Dev Studio health endpoint. */
// AUTH: Enforced inside handler via apiRequireDevStudio.
export async function GET(req: NextRequest) {
  return handleDevStudioHealth(req);
}
