/** Production readiness is about eligible work, not erasing paused/history. */
export function productionWorkScope(rows) {
 if(!Array.isArray(rows) || rows.some(row=>!row?.build || Array.isArray(row.build) ||
    typeof row.build.status!=='string' || !['completed','failed','queued','running'].includes(row.status)))
  throw Error('PRODUCTION_BUILD_SCOPE_EVIDENCE_REQUIRED');
 const counts=Object.fromEntries(['completed','failed','queued','running']
  .map(status=>[status,rows.filter(row=>row.status===status).length]));
 const paused=rows.filter(row=>row.build.owner_paused==='true');
 const eligible=rows.filter(row=>row.build.owner_paused!=='true' &&
  !['published','archived','cancelled'].includes(row.build.status));
 return {counts,paused,eligible,
  actionableFailed:eligible.filter(row=>row.status==='failed'),
  actionableQueued:eligible.filter(row=>row.status==='queued'),
  actionableRunning:eligible.filter(row=>row.status==='running')};
}
