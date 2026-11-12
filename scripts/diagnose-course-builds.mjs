#!/usr/bin/env node
/**
 * Course Builder queue diagnostics with checkpoint-specific recovery.
 *
 *   pnpm diagnose:course-builds --hours 720                 # read-only report
 *   pnpm diagnose:course-builds --apply                     # requeue dead leases only
 *   pnpm diagnose:course-builds --apply --requeue-codes TEACHING_PHOTO_HASH_MISMATCH
 *
 * Owner review and approved successors are left to
 * scripts/gcp/publish-approved-courses.ts. Retry-exhausted jobs are requeued
 * only for error codes explicitly named in --requeue-codes.
 */
import { createClient } from '@supabase/supabase-js';
import { pathToFileURL } from 'node:url';

const STALE_HEARTBEAT_MS = 30 * 60_000;
const RELEASE_PATH = 'OWNER_COURSE_REVIEW_REQUIRED';
const SUCCESSOR_PATH = 'WAITING_FOR_CORRECTED_COMPLETE_LESSON_WORKER';

export function parseArgs(argv) {
  const args = { hours: 168, apply: false, json: false, requeueCodes: [] };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--hours') args.hours = Number(argv[++i]);
    else if (arg === '--apply' || arg === '--requeue-stuck') args.apply = true;
    else if (arg === '--json') args.json = true;
    else if (arg === '--requeue-codes') args.requeueCodes = String(argv[++i] ?? '').split(',').map(s => s.trim()).filter(Boolean);
  }
  if (!Number.isFinite(args.hours) || args.hours <= 0) throw Error('DIAGNOSE_HOURS_INVALID');
  if (args.requeueCodes.some(code => !/^[A-Z][A-Z0-9_]+$/.test(code))) throw Error('DIAGNOSE_REQUEUE_CODES_INVALID');
  return args;
}

export const errorCode = value => (value ? String(value).split(':')[0].trim() : null);

/** Decide one recovery path per job. Never a blanket reset. */
export function classifyJob(job, build, { now = Date.now(), latestJobId, requeueCodes = [] } = {}) {
  const code = errorCode(job.last_error);
  if (latestJobId && latestJobId !== job.id) return { action: 'superseded', code };
  if (!build) return { action: 'needs-investigation', code, reason: 'BUILD_NOT_FOUND' };
  if (['published', 'archived'].includes(build.status)) return { action: 'none', code, reason: 'BUILD_' + build.status.toUpperCase() };
  if (build.profile?.ownerPaused === true) return { action: 'none', code, reason: 'OWNER_PAUSED' };
  if (job.status === 'running') {
    const leaseExpired = !job.lease_expires_at || Date.parse(job.lease_expires_at) < now;
    const heartbeatStale = !job.heartbeat_at || now - Date.parse(job.heartbeat_at) > STALE_HEARTBEAT_MS;
    if (leaseExpired && job.attempts < job.max_attempts) return { action: 'dead-lease-requeue', code, heartbeatStale };
    if (leaseExpired) {
      if (requeueCodes.includes(code)) return { action: 'exhausted-requeue', code };
      return { action: 'needs-code-change', code, reason: 'LEASE_EXPIRED_RETRY_EXHAUSTED' };
    }
    if (heartbeatStale) return { action: 'stuck-live-lease', code, reason: 'HEARTBEAT_STALE_LEASE_ACTIVE' };
    return { action: 'none', code, reason: 'RUNNING' };
  }
  if (job.status !== 'failed' && job.status !== 'blocked') return { action: 'none', code, reason: job.status.toUpperCase() };
  if (code === RELEASE_PATH) return { action: 'release-path', code };
  if (code === SUCCESSOR_PATH) return { action: 'successor-path', code };
  if (job.attempts >= job.max_attempts) {
    if (requeueCodes.includes(code)) return { action: 'exhausted-requeue', code };
    return { action: 'needs-code-change', code, reason: 'RETRY_EXHAUSTED' };
  }
  return { action: 'needs-code-change', code, reason: 'FAILED_WITH_RETRY_BUDGET' };
}

async function requeue(db, job, { fromStatus, clearAttempts }) {
  const now = new Date().toISOString();
  let query = db.from('ultimate_build_jobs').update({
    status: 'queued', ...(clearAttempts ? { attempts: 0, last_error: null } : {}),
    execution_generation: job.execution_generation + 1, available_at: now,
    lease_owner: null, lease_expires_at: null, updated_at: now,
  }).eq('id', job.id).eq('status', fromStatus).eq('execution_generation', job.execution_generation);
  query = job.lease_owner ? query.eq('lease_owner', job.lease_owner) : query.is('lease_owner', null);
  const { data, error } = await query.select('id');
  if (error) throw error;
  if (data?.length !== 1) return false;
  const build = await db.from('ultimate_course_builds').update({ status: 'queued', updated_at: now })
    .eq('id', job.build_id).in('status', ['failed', 'blocked', 'running']);
  if (build.error) throw build.error;
  return true;
}

export async function diagnoseCourseBuilds(db, { hours = 24, apply = false, requeueCodes = [], now = Date.now() } = {}) {
  const since = new Date(now - hours * 3600_000).toISOString();
  const [recent, running] = await Promise.all([
    db.from('ultimate_build_jobs').select('id,build_id,job_type,status,attempts,max_attempts,lease_owner,lease_expires_at,heartbeat_at,last_error,execution_generation,updated_at,created_at')
      .gte('updated_at', since).order('updated_at', { ascending: false }).limit(5000),
    db.from('ultimate_build_jobs').select('id,build_id,job_type,status,attempts,max_attempts,lease_owner,lease_expires_at,heartbeat_at,last_error,execution_generation,updated_at,created_at')
      .eq('status', 'running').limit(1000),
  ]);
  if (recent.error || running.error) throw recent.error ?? running.error;
  const jobs = new Map([...(recent.data ?? []), ...(running.data ?? [])].map(job => [job.id, job]));
  const buildIds = [...new Set([...jobs.values()].map(job => job.build_id))];
  const builds = new Map();
  const latest = new Map();
  for (let i = 0; i < buildIds.length; i += 200) {
    const ids = buildIds.slice(i, i + 200);
    const [b, all] = await Promise.all([
      db.from('ultimate_course_builds').select('id,course_id,status,profile,updated_at').in('id', ids),
      db.from('ultimate_build_jobs').select('id,build_id,job_type,created_at').in('build_id', ids).order('created_at', { ascending: false }),
    ]);
    if (b.error || all.error) throw b.error ?? all.error;
    for (const build of b.data ?? []) builds.set(build.id, build);
    for (const job of all.data ?? []) { const key = job.build_id + ':' + job.job_type; if (!latest.has(key)) latest.set(key, job.id); }
  }
  const statusCounts = {}, errorCounts = {}, rows = [];
  for (const job of jobs.values()) {
    statusCounts[job.status] = (statusCounts[job.status] ?? 0) + 1;
    const build = builds.get(job.build_id);
    const decision = classifyJob(job, build, { now, latestJobId: latest.get(job.build_id + ':' + job.job_type), requeueCodes });
    if (decision.code && ['failed', 'blocked'].includes(job.status)) errorCounts[decision.code] = (errorCounts[decision.code] ?? 0) + 1;
    if (decision.action === 'none' || decision.action === 'superseded') continue;
    let applied = null;
    if (apply && decision.action === 'dead-lease-requeue') applied = await requeue(db, job, { fromStatus: 'running', clearAttempts: false });
    if (apply && decision.action === 'exhausted-requeue') applied = await requeue(db, job, { fromStatus: job.status, clearAttempts: true });
    rows.push({ jobId: job.id, buildId: job.build_id, courseId: build?.course_id ?? null, title: build?.profile?.title ?? null,
      jobType: job.job_type, jobStatus: job.status, buildStatus: build?.status ?? null, attempts: job.attempts, maxAttempts: job.max_attempts,
      heartbeatAt: job.heartbeat_at, leaseExpiresAt: job.lease_expires_at, lastError: job.last_error ? String(job.last_error).slice(0, 200) : null,
      ...decision, ...(applied === null ? {} : { applied }) });
  }
  const actions = rows.reduce((acc, row) => ({ ...acc, [row.action]: (acc[row.action] ?? 0) + 1 }), {});
  return { since, hours, apply, statusCounts, errorCounts: Object.fromEntries(Object.entries(errorCounts).sort((a, b) => b[1] - a[1])), actions,
    stuckRunning: rows.filter(row => row.jobStatus === 'running'), jobs: rows };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = parseArgs(process.argv.slice(2));
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) { console.error('COURSE_DIAGNOSTICS_AUTH_REQUIRED'); process.exit(1); }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://cuxzzpsyufcewtmicszk.supabase.co';
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  diagnoseCourseBuilds(db, args).then(report => {
    if (args.json) return console.log(JSON.stringify(report, null, 2));
    console.log(`Course builds since ${report.since} (${report.hours}h)${report.apply ? ' [APPLY]' : ' [read-only]'}`);
    console.log('Job status:', JSON.stringify(report.statusCounts));
    console.log('Failure codes:', JSON.stringify(report.errorCounts));
    console.log('Actions:', JSON.stringify(report.actions));
    for (const row of report.jobs) console.log([row.action, row.jobStatus, row.code ?? '-', `${row.attempts}/${row.maxAttempts}`, row.title ?? row.courseId ?? '-', row.jobId, row.applied === undefined ? '' : 'applied=' + row.applied].join(' | '));
  }).catch(error => { console.error(error?.message ?? 'COURSE_DIAGNOSTICS_FAILED'); process.exitCode = 1; });
}
