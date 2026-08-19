import { NextRequest } from 'next/server';

import { handleDevStudioHealth } from '@/lib/devstudio/health-handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Legacy compatibility path. Canonical endpoint:
 * /api/admin/dev-studio/health
 */
export async function GET(req: NextRequest) {
  const response = await handleDevStudioHealth(req);
  response.headers.set('Deprecation', 'true');
  response.headers.set('Link', '</api/admin/dev-studio/health>; rel="successor-version"');
  return response;
}
