import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { runGuardrailEvaluation } from '@/lib/governance/guardrail-engine';

export const runtime = 'nodejs';
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/guardrail-evaluation
 * Daily cron: evaluates all active program holders against compliance guardrails.
 * Add ?dry_run=true to preview without applying enforcement.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dryRun = request.nextUrl.searchParams.get('dry_run') === 'true';

  try {
    const result = await runGuardrailEvaluation({ dryRun, severity: 'all' });
    logger.info('[cron/guardrail-evaluation] complete', result);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    logger.error('[cron/guardrail-evaluation] failed', error as Error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
