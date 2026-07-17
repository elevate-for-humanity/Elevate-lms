/**
 * POST /api/workflows/webhook/[key]
 *
 * External webhook trigger for workflows. Any system can POST to this
 * endpoint with a workflow's webhook_key to fire it.
 *
 * The workflow must have webhook_key set and be active.
 * Rate-limited to prevent abuse. No auth required (key is the secret).
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { executeWorkflow } from '@/lib/workflows/engine';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const { key } = await params;
  if (!key?.trim()) {
    return NextResponse.json({ error: 'Missing webhook key' }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));

  const db = await requireAdminClient();

  const { data: workflow, error } = await db
    .from('workflows')
    .select('id, name, status')
    .eq('webhook_key', key)
    .eq('status', 'active')
    .maybeSingle();

  if (error) {
    logger.error('[workflows/webhook] DB error', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }

  if (!workflow) {
    // Return 404 without leaking whether the key exists
    return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
  }

  try {
    const result = await executeWorkflow(workflow.id, 'webhook', body ?? {});
    logger.info('[workflows/webhook] Fired', { workflowId: workflow.id, key, status: result.status });
    return NextResponse.json({ ok: true, run_id: result.runId, status: result.status });
  } catch (err: any) {
    logger.error('[workflows/webhook] Execution failed', err);
    return NextResponse.json({ error: 'Workflow execution failed' }, { status: 500 });
  }
}
