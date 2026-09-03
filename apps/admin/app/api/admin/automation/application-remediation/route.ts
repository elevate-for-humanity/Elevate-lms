export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeInternalError } from '@/lib/api/safe-error';
import { remediateMissingApplicationDocuments } from '@/lib/automation/application-document-remediation';
import { requireAdminClient } from '@/lib/supabase/admin';

const schema = z.object({
  applicationId: z.string().uuid(),
  triggerType: z.string().trim().min(1).max(80).default('admin_reconciliation'),
});

export async function GET(request: NextRequest) {
  const limited = await applyRateLimit(request, 'api');
  if (limited) return limited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const db = await requireAdminClient();
    const { data, error } = await db
      .from('automation_followups')
      .select('id, workflow_key, subject_type, subject_id, state, detected_condition, proposed_action, action_policy, execution_status, attempt_count, max_attempts, last_attempt_at, escalation_status, failure_reason, updated_at')
      .eq('workflow_key', 'application_missing_documents')
      .in('escalation_status', ['needed', 'created'])
      .order('updated_at', { ascending: false })
      .limit(200);

    if (error) throw error;
    return NextResponse.json({ ok: true, exceptions: data || [] });
  } catch (error) {
    return safeInternalError(error, 'Unable to load remediation exceptions');
  }
}

export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'strict');
  if (limited) return limited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Invalid remediation request.', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const db = await requireAdminClient();
    const result = await remediateMissingApplicationDocuments(
      db,
      parsed.data.applicationId,
      parsed.data.triggerType,
    );
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return safeInternalError(error, 'Application remediation failed');
  }
}
