import 'server-only';

/** Historical failures remain evidence. Retirement prevents replay and never
 * substitutes for independent code, deployment or runtime verification. */
export function recoveredIncident(repair: any, events: any[]) {
  if (repair.source_job_id || !['queued', 'blocked'].includes(repair.status)) return null;
  const match = String(repair.fingerprint ?? '').match(/^(.+):(quality|unknown):(?:[a-f0-9]{40}|incident:.+)$/);
  if (!match || !String(repair.goal ?? '').startsWith(`Diagnose and repair the recurring ${match[2]} failure in ${match[1]}.`)) return null;
  // A successful call with no correlation is only a service observation.
  // It cannot certify unrelated GitHub, model-timeout or code-repair incidents.
  // Legacy "unavailable" correlations retain their history until a distinct
  // failure-specific recovery can be demonstrated.
  const correlation = String(repair.goal ?? '').match(/Correlation:\s*([^\n.]+)\.?/i)?.[1]?.trim();
  if (!correlation || correlation === 'unavailable') return null;
  const lastAttempt = Date.parse(repair.updated_at ?? repair.created_at);
  if (!Number.isFinite(lastAttempt)) return null;
  const related = events.filter(event => event.operation === match[1] &&
    event.correlation_id === correlation && Number.isFinite(Date.parse(event.created_at)));
  const recovery = related.filter(event => event.status === 'completed' &&
    Date.parse(event.created_at) > lastAttempt)
    .sort((left, right) => Date.parse(right.created_at) - Date.parse(left.created_at))[0];
  if (!recovery) return null;
  // A subsequent failure cancels recovery evidence; do not retire on the
  // strength of a transient success during an ongoing failed incident.
  if (related.some(event => event.status === 'failed' &&
    Date.parse(event.created_at) > Date.parse(recovery.created_at))) return null;
  return { disposition: 'historical_incident_recovered', replay: false, operation: match[1],
    correlationId: correlation, recoveryEventId: recovery.id,
    recoveredAt: recovery.created_at, verifiedRepair: false };
}

/** A completed source job is not proof that an autonomous code repair was deployed.
 * Retain its blocked ledger row and attempt history, but prevent duplicate replay
 * of a historical source outcome with no repair execution or release candidate. */
export function completedSourceIncident(repair: any, source: any) {
  if (!repair.source_job_id || !['queued', 'blocked'].includes(repair.status) ||
    repair.attempt_count !== 0 || repair.workflow_run_id != null || repair.candidate != null ||
    !['SOURCE_DEFECT_RESOLVED', 'SOURCE_DEPENDENCY_EVIDENCE_REQUIRED',
      'SOURCE_WORKER_COMPLETED_ACCEPTANCE_PENDING'].includes(repair.error_code)) return null;
  if (source?.id !== repair.source_job_id || source.status !== 'completed') return null;
  return {
    disposition: 'source_job_completed_acceptance_unverified', replay: false,
    sourceJobId: source.id, sourceStatus: source.status, verifiedRepair: false,
  };
}

export async function reconcileRecoveredRepairs(db: any, events: any[]) {
  const rows: any[] = [];
  for (let page = 0; ; page++) {
    if (page >= 10) throw Error('PARIS_REPAIR_RECONCILIATION_SCAN_LIMIT');
    const result = await db.from('paris_code_repairs').select('id,status,goal,fingerprint,source_job_id,updated_at,created_at,error_code,verification,attempt_count,workflow_run_id,candidate')
      .in('status', ['queued', 'blocked']).order('created_at', { ascending: true }).order('id', { ascending: true })
      .range(page * 200, page * 200 + 199);
    if (result.error) throw result.error;
    if (!Array.isArray(result.data)) throw Error('PARIS_REPAIR_RECONCILIATION_EVIDENCE_REQUIRED');
    rows.push(...result.data);
    if (result.data.length < 200) break;
  }
  // Batch-read exact originating jobs; do not infer source completion from a
  // repair error label or from the public application's generic readiness.
  const eligible = rows.filter(repair => repair.source_job_id &&
    repair.attempt_count === 0 && repair.workflow_run_id == null &&
    repair.candidate == null &&
    ['SOURCE_DEFECT_RESOLVED', 'SOURCE_DEPENDENCY_EVIDENCE_REQUIRED',
      'SOURCE_WORKER_COMPLETED_ACCEPTANCE_PENDING'].includes(repair.error_code) &&
    repair.verification?.reconciliation?.replay !== false);
  const sourceIds = [...new Set(eligible.map(repair => repair.source_job_id))];
  const sources = new Map<string, any>();
  if (sourceIds.length) {
    const result = await db.from('ultimate_build_jobs').select('id,status').in('id', sourceIds);
    if (result.error) throw result.error;
    if (!Array.isArray(result.data)) throw Error('PARIS_SOURCE_RECONCILIATION_EVIDENCE_REQUIRED');
    for (const source of result.data) sources.set(source.id, source);
  }
  let retired = 0;
  for (const repair of rows) {
    const evidence = recoveredIncident(repair, events) ??
      completedSourceIncident(repair, sources.get(repair.source_job_id));
    if (!evidence || repair.verification?.reconciliation?.replay === false) continue;
    const result = await db.from('paris_code_repairs').update({status:'blocked',
      ...(repair.status === 'queued' ? {error_code:'SOURCE_INCIDENT_RECOVERED'} : {}),
      verification:{...repair.verification,reconciliation:evidence},updated_at:new Date().toISOString()})
      .eq('id',repair.id).eq('status',repair.status).eq('updated_at',repair.updated_at).select('id').maybeSingle();
    if (result.error) throw result.error;
    if (result.data) retired++;
  }
  return { scanned: rows.length, retired };
}
