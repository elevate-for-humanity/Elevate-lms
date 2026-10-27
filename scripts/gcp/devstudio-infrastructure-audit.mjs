/**
 * Read-only Dev Studio infrastructure_audit worker.
 * Runs via GitHub Actions WIF, never through arbitrary SQL execution.
 * Claims exactly one queued job using a compare-and-set REST update.
 */
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';

const project = 'elegant-racer-299721';
const region = 'us-central1';
const root = (process.env.SUPABASE_URL || 'https://cuxzzpsyufcewtmicszk.supabase.co').replace(/\/$/, '');
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
const api = root + '/rest/v1/devstudio_jobs';
const headers = { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' };
const worker = 'github-infra-audit:' + randomUUID();

async function rest(url, opts = {}) {
  const res = await fetch(url, { ...opts, headers: { ...headers, ...(opts.headers || {}) }, signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error('Supabase HTTP ' + res.status + ' on ' + opts.method);
  return res.status === 204 ? [] : res.json();
}
async function cloud(path, token) {
  const res = await fetch('https://run.googleapis.com/v2/' + path, {
    headers: { Authorization: 'Bearer ' + token },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error('Cloud Run API ' + res.status + ' on ' + path);
  return res.json();
}
const search = new URL(api);
search.searchParams.set('select', 'id,status,tool_name,attempts,max_attempts');
search.searchParams.set('tool_name', 'eq.infrastructure_audit');
search.searchParams.set('status', 'eq.queued');
search.searchParams.set('run_at', 'lte.' + new Date().toISOString());
search.searchParams.set('order', 'created_at.asc');
search.searchParams.set('limit', '1');
const jobs = await rest(search);
if (!jobs.length) {
  console.log('No eligible infrastructure audit jobs');
  process.exit(0);
}
const job = jobs[0];
if (job.attempts >= job.max_attempts) {
  console.log('Job has no attempts remaining: ' + job.id);
  process.exit(1);
}
const claim = new URL(api);
claim.searchParams.set('id', 'eq.' + job.id);
claim.searchParams.set('status', 'eq.queued');
claim.searchParams.set('attempts', 'eq.' + job.attempts);
const claimed = await rest(claim, {
  method: 'PATCH', headers: { Prefer: 'return=representation' },
  body: JSON.stringify({
    status: 'running', stage: 'inventory', locked_by: worker,
    locked_at: new Date().toISOString(), attempts: job.attempts + 1,
    updated_at: new Date().toISOString(),
  }),
});
if (claimed.length !== 1) {
  console.log('Another worker claimed this job.');
  process.exit(0);
}
async function finish(state, patch) {
  const target = new URL(api);
  target.searchParams.set('id', 'eq.' + job.id);
  target.searchParams.set('status', 'eq.running');
  target.searchParams.set('locked_by', 'eq.' + worker);
  await rest(target, { method: 'PATCH', body: JSON.stringify({
    status: state, finished_at: new Date().toISOString(),
    locked_at: null, locked_by: null, updated_at: new Date().toISOString(), ...patch,
  }) });
}
try {
  const token = execFileSync('gcloud', ['auth', 'print-access-token'], { encoding: 'utf8' }).trim();
  const parent = 'projects/' + project + '/locations/' + region;
  const [services, jobs] = await Promise.all([
    cloud(parent + '/services?pageSize=100', token),
    cloud(parent + '/jobs?pageSize=100', token),
  ]);
  const summary = {
    audit_scope: 'read_only', project, region, observed_at: new Date().toISOString(),
    services: (services.services || []).map(s => ({
      name: s.name, uri: s.uri, ingress: s.ingress,
      latestReadyRevision: s.latestReadyRevision,
      template: { scaling: s.template?.scaling, containers: (s.template?.containers || []).map(c => ({ resources: c.resources })) },
      traffic: s.traffic,
    })),
    jobs: (jobs.jobs || []).map(j => ({
      name: j.name, taskCount: j.template?.taskCount,
      parallelism: j.template?.parallelism, maxRetries: j.template?.maxRetries,
      containers: (j.template?.template?.containers || []).map(c => ({ resources: c.resources })),
    })),
    caveat: 'This is Cloud Run configuration inventory, not regional quota consumption or billing measurement.',
  };
  await finish('completed', { stage: 'inventory_complete', progress: 100, result: summary, error: null,
    log_lines: ['Read-only Cloud Run inventory completed', 'No resources changed', 'Quota/billing measurements require additional APIs.'] });
  console.log('Recorded audit ' + job.id + ': ' + summary.services.length + ' services, ' + summary.jobs.length + ' jobs');
} catch (err) {
  const message = String(err?.message || err).slice(0,700);
  await finish('failed', { stage: 'error', error: message, result: { read_only: true, root_cause: message },
    log_lines: ['Infrastructure audit worker failed: ' + message] });
  throw err;
}
