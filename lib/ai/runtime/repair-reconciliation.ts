import 'server-only';

/** Historical failures remain evidence. Retirement prevents replay and never
 * substitutes for independent code, deployment or runtime verification. */
export function recoveredIncident(repair: any, events: any[]) {
  if (repair.source_job_id || !['queued', 'blocked'].includes(repair.status)) return null;
  const match = String(repair.fingerprint ?? '').match(/^(.+):(quality|unknown):(?:[a-f0-9]{40}|incident:.+)$/);
  if (!match || !String(repair.goal ?? '').startsWith(`Diagnose and repair the recurring ${match[2]} failure in ${match[1]}.`)) return null;
  const recovery = events.filter(event => event.operation === match[1] && event.status === 'completed')
    .sort((left, right) => Date.parse(right.created_at) - Date.parse(left.created_at))[0];
  const lastAttempt = Date.parse(repair.updated_at ?? repair.created_at);
  if (!recovery || !Number.isFinite(lastAttempt) || Date.parse(recovery.created_at) <= lastAttempt) return null;
  return { disposition: 'historical_incident_recovered', replay: false, operation: match[1],
    recoveryEventId: recovery.id, recoveredAt: recovery.created_at, verifiedRepair: false };
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
