import { pathToFileURL } from 'node:url';

// Read metadata only. Never restore, download database contents, or print tokens.
export function assessDatabaseRecovery(body, now = Date.now()) {
  const dates = (Array.isArray(body?.backups) ? body.backups : [])
    .filter(item => item.status === 'COMPLETED')
    .map(item => Date.parse(item.inserted_at));
  const physical = body?.physical_backup_data?.latest_physical_backup_date_unix;
  if (typeof physical === 'number' && physical > 0) dates.push(physical * 1000);
  const valid = dates.filter(value => Number.isFinite(value) && value > 0 && value <= now);
  const latest = valid.length ? Math.max(...valid) : null;
  const ageHours = latest === null ? null : (now - latest) / 3600000;
  return { databaseRecovery: ageHours !== null && ageHours <= 36 ? 'recent_recovery_point' : 'unverified_or_stale',
    latestRecoveryPoint: latest === null ? null : new Date(latest).toISOString(),
    ageHours: ageHours === null ? null : Math.round(ageHours * 10) / 10,
    pitrEnabled: body?.pitr_enabled === true,
    objectBackup: 'not_covered_by_database_backup', restoreTest: 'not_performed' };
}

export async function checkDatabaseRecovery({ env = process.env, request = fetch } = {}) {
  const project = env.SUPABASE_PROJECT_ID;
  if (project !== 'cuxzzpsyufcewtmicszk' || !env.SUPABASE_ACCESS_TOKEN)
    throw new Error('Expected production project and backup-read token are required; recovery is unverified.');
  let response;
  try {
    response = await request(`https://api.supabase.com/v1/projects/${project}/database/backups`, {
      method: 'GET', headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}` },
      signal: AbortSignal.timeout(30000),
    });
  } catch { throw new Error('Database recovery metadata request failed; no success inferred.'); }
  if (!response.ok) throw new Error(`Database recovery metadata unavailable (HTTP ${response.status}); no success inferred.`);
  let body;
  try { body = await response.json(); }
  catch { throw new Error('Database recovery metadata response was invalid; no success inferred.'); }
  return assessDatabaseRecovery(body);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  checkDatabaseRecovery().then(report => {
    console.log(JSON.stringify(report));
    if (report.databaseRecovery !== 'recent_recovery_point') process.exitCode = 1;
  }).catch(error => { console.error(error.message); process.exitCode = 1; });
}
