export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { cronHandler } from '@/lib/api/cron-handler';
import { reconcileApplicationRemediations } from '@/lib/automation/reconcile-application-remediations';

export const GET = cronHandler('application-document-remediation', async (db, request) => {
  const requested = Number(new URL(request.url).searchParams.get('limit') || 50);
  const result = await reconcileApplicationRemediations(db, requested);
  return result as unknown as Record<string, unknown>;
});
