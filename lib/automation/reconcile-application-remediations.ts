import type { SupabaseClient } from '@supabase/supabase-js';

import { remediateMissingApplicationDocuments, type RemediationResult } from './application-document-remediation';

const MAX_BATCH = 100;

export interface ReconciliationSummary {
  checked: number;
  outcomes: Record<string, number>;
  results: RemediationResult[];
}

export async function reconcileApplicationRemediations(
  db: SupabaseClient,
  limit = 50,
): Promise<ReconciliationSummary> {
  const capped = Math.max(1, Math.min(limit, MAX_BATCH));
  const nowIso = new Date().toISOString();

  const [{ data: due }, { data: awaiting }] = await Promise.all([
    db
      .from('automation_followups')
      .select('subject_id')
      .eq('workflow_key', 'application_missing_documents')
      .eq('subject_type', 'application')
      .in('state', ['open', 'waiting', 'failed'])
      .lte('next_check_at', nowIso)
      .limit(capped),
    db
      .from('applications')
      .select('id')
      .eq('status', 'awaiting_documents')
      .order('updated_at', { ascending: true })
      .limit(capped),
  ]);

  const applicationIds = Array.from(new Set([
    ...(due || []).map((row: { subject_id: string }) => row.subject_id),
    ...(awaiting || []).map((row: { id: string }) => row.id),
  ])).slice(0, capped);

  const results: RemediationResult[] = [];
  for (const applicationId of applicationIds) {
    try {
      results.push(await remediateMissingApplicationDocuments(db, applicationId, 'scheduled_reconciliation'));
    } catch (error) {
      results.push({
        outcome: 'failed',
        applicationId,
        missingDocuments: [],
        attemptCount: 0,
        message: error instanceof Error ? error.message : 'Reconciliation failed',
      });
    }
  }

  const outcomes = results.reduce<Record<string, number>>((acc, result) => {
    acc[result.outcome] = (acc[result.outcome] || 0) + 1;
    return acc;
  }, {});

  return { checked: results.length, outcomes, results };
}
