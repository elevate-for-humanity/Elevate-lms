#!/usr/bin/env node
// Diagnose Ultimate Course Builder jobs. Read-only unless --requeue-stuck is passed.
//   pnpm diagnose:course-builds --hours 24 [--requeue-stuck]
import { createClient } from '@supabase/supabase-js';

function parseArgs(argv) {
  const options = { hours: 24, requeueStuck: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--requeue-stuck') options.requeueStuck = true;
    else if (arg === '--hours' || arg.startsWith('--hours=')) {
      const value = arg.includes('=') ? arg.split('=')[1] : argv[++i];
      const hours = Number(value);
      if (!Number.isFinite(hours) || hours <= 0 || hours > 24 * 90) {
        console.error('--hours must be a number between 0 and 2160');
        process.exit(2);
      }
      options.hours = hours;
    } else if (arg !== '--') {
      console.error(`Unknown argument: ${arg}`);
      process.exit(2);
    }
  }
  return options;
}

const errorCode = (lastError) => (lastError ? String(lastError).split(':')[0].trim() || 'UNKNOWN' : 'UNKNOWN');

function lessonCursor(job, build) {
  const progress = job.payload?.progress ?? {};
  const lesson = progress.lessonIndex ?? progress.lesson ?? progress.lessonKey ?? progress.cursor ?? null;
  const parts = [];
  if (lesson !== null && lesson !== undefined) parts.push(`lesson=${lesson}`);
  if (progress.phase) parts.push(`phase=${progress.phase}`);
  if (build?.current_step) parts.push(`step=${build.current_step}`);
  return parts.join(' ') || 'n/a';
}

async function main() {
  const { hours, requeueStuck } = parseArgs(process.argv.slice(2));
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(2);
  }
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const now = new Date();
  const since = new Date(now.getTime() - hours * 3600_000).toISOString();
  const columns = 'id,build_id,job_type,status,attempts,max_attempts,lease_owner,lease_expires_at,heartbeat_at,last_error,payload,updated_at';

  const [recent, running] = await Promise.all([
    db.from('ultimate_build_jobs').select(columns).gte('updated_at', since).order('updated_at', { ascending: false }).limit(1000),
    db.from('ultimate_build_jobs').select(columns).eq('status', 'running').limit(1000),
  ]);
  if (recent.error || running.error) {
    console.error('ultimate_build_jobs query failed:', (recent.error || running.error).message);
    process.exit(1);
  }
  const jobs = new Map([...(recent.data ?? []), ...(running.data ?? [])].map((job) => [job.id, job]));
  const buildIds = [...new Set([...jobs.values()].map((job) => job.build_id))];
  const builds = new Map();
  for (let i = 0; i < buildIds.length; i += 200) {
    const result = await db.from('ultimate_course_builds').select('id,course_id,status,current_step,updated_at').in('id', buildIds.slice(i, i + 200));
    if (result.error) {
      console.error('ultimate_course_builds query failed:', result.error.message);
      process.exit(1);
    }
    for (const build of result.data ?? []) builds.set(build.id, build);
  }

  const all = [...jobs.values()];
  const counts = all.reduce((acc, job) => ({ ...acc, [job.status]: (acc[job.status] ?? 0) + 1 }), {});
  console.log(`Course builds — last ${hours}h (since ${since})`);
  console.log(`Jobs: ${all.length} ${JSON.stringify(counts)}  Builds: ${builds.size}`);

  const failures = all.filter((job) => job.status === 'failed' && job.updated_at >= since);
  const groups = new Map();
  for (const job of failures) groups.set(errorCode(job.last_error), [...(groups.get(errorCode(job.last_error)) ?? []), job]);
  console.log(`\nFailures by error code (${failures.length}):`);
  if (!failures.length) console.log('  none');
  for (const [code, list] of [...groups].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${code}: ${list.length}`);
    for (const job of list) {
      const build = builds.get(job.build_id);
      console.log(`    build_id=${job.build_id} job=${job.id} attempts=${job.attempts}/${job.max_attempts} build_status=${build?.status ?? 'missing'} cursor: ${lessonCursor(job, build)}`);
    }
  }

  const stuck = all.filter((job) => job.status === 'running' && job.lease_expires_at && new Date(job.lease_expires_at) < now);
  console.log(`\nRunning jobs with expired leases (${stuck.length}):`);
  if (!stuck.length) console.log('  none');
  for (const job of stuck) {
    const build = builds.get(job.build_id);
    console.log(`  build_id=${job.build_id} job=${job.id} owner=${job.lease_owner ?? 'n/a'} lease_expired=${job.lease_expires_at} attempts=${job.attempts}/${job.max_attempts} cursor: ${lessonCursor(job, build)}`);
  }

  if (requeueStuck && stuck.length) {
    console.log('\nRequeueing expired-lease jobs:');
    for (const job of stuck) {
      if (job.attempts >= job.max_attempts) {
        console.log(`  skipped ${job.id}: attempts exhausted (${job.attempts}/${job.max_attempts})`);
        continue;
      }
      const result = await db.from('ultimate_build_jobs')
        .update({ status: 'queued', lease_owner: null, lease_expires_at: null, updated_at: new Date().toISOString() })
        .eq('id', job.id).eq('status', 'running').lt('lease_expires_at', new Date().toISOString())
        .select('id');
      if (result.error) console.log(`  failed ${job.id}: ${result.error.message}`);
      else console.log(`  ${result.data?.length ? 'requeued' : 'skipped (lease renewed or state changed)'} ${job.id}`);
    }
  } else if (stuck.length) {
    console.log('\nRe-run with --requeue-stuck to return expired-lease jobs to queued.');
  }
}

main().catch((error) => {
  console.error('diagnose-course-builds failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
