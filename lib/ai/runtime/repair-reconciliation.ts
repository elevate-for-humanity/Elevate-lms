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
  const correlation = String(repair.goal ?? '').match(/Correlation:\\s*([^\\n.]+)\\.?/i)?.[1]?.trim();
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

export async function reconcileRecoveredRepairs(db: any, events: any[]) {
  const rows: any[] = [];
  for (let page = 0; ; page++) {
    if (page >= 10) throw Error('PARIS_REPAIR_RECONCILIATION_SCAN_LIMIT');
    const result = await db.from('paris_code_repairs').select('id,status,goal,fingerprint,source_job_id,updated_at,created_at,error_code,verification')
      .in('status', ['queued', 'blocked']).order('created_at', { ascending: true }).order('id', { ascending: true })
      .range(page * 200, page * 200 + 199);
    if (result.error) throw result.error;
    if (!Array.isArray(result.data)) throw Error('PARIS_REPAIR_RECONCILIATION_EVIDENCE_REQUIRED');
    rows.push(...result.data);
    if (result.data.length < 200) break;
  }
  let retired = 0;
  for (const repair of rows) {
    const evidence = recoveredIncident(repair, events);
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
