#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const exists = (rel) => fs.existsSync(path.join(root, rel));
const read = (rel) => exists(rel) ? fs.readFileSync(path.join(root, rel), 'utf8') : '';
const requireFile = (rel) => {
  if (!exists(rel)) failures.push(`missing canonical file: ${rel}`);
  return read(rel);
};

if (exists('lib/course-builder/video-queue.ts')) {
  failures.push('deprecated lib/course-builder/video-queue.ts must not exist');
}

const manager = requireFile('lib/course-factory/media-manager.ts');
for (const token of [
  'resetCanonicalMediaJob',
  'recoverCourseMediaJobs',
  'getCourseMediaState',
  'COURSE_MEDIA_MAX_RETRIES',
  'courseMediaRetryDelayMs',
  'lessonStateMismatches',
  'microclipStateMismatches',
]) {
  if (!manager.includes(token)) failures.push(`Course Factory media manager missing ${token}`);
}

const jobQueue = requireFile('lib/video/job-queue.ts');
for (const token of ["error?.code === '23505'", 'findCanonicalJob', 'retry_count', 'last_provider', 'last_failure_at']) {
  if (!jobQueue.includes(token)) failures.push(`canonical job state missing ${token}`);
}
if (/export async function resetJob\s*\(/.test(jobQueue)) {
  failures.push('lesson-only resetJob was reintroduced; retry policy belongs to Course Factory');
}

const worker = requireFile('apps/admin/app/api/internal/videos/process-queue/route.ts');
for (const token of ['courseId', 'processClaimedVideoJob', 'finalizeCourseAutomaticallyIfReadyWithClient', "eq('status', 'queued')", "order('asset_kind'"]) {
  if (!worker.includes(token)) failures.push(`renderer worker missing ${token}`);
}
for (const forbidden of ['Unexpected server response: 403', 'retried403', 'staleBefore', "eq('status', 'failed')"]) {
  if (worker.includes(forbidden)) failures.push(`renderer worker contains retry/recovery policy: ${forbidden}`);
}

const background = requireFile('lib/video/background-worker.ts');
if (!background.includes('recoverCourseMediaJobs')) failures.push('background orchestration does not delegate recovery to Course Factory');

const executor = requireFile('lib/agentic/course-executor.ts');
for (const token of ['getCourseMediaState', 'completePackage', "mode: target.courseId ? 'missing-only' : 'replace'"]) {
  if (!executor.includes(token)) failures.push(`Studio course executor missing canonical invariant ${token}`);
}
if (/async function courseMediaState\s*\(/.test(executor)) failures.push('Studio reintroduced a duplicate media readiness calculator');

const acceptance = requireFile('scripts/course-factory/build-esb-acceptance.ts');
for (const token of [
  "const EXPECTED_MAIN_VIDEOS = 35",
  "const EXPECTED_MICROCLIPS = 70",
  "const EXPECTED_MEDIA = 105",
  "mode: 'refresh'",
  "contentSource: 'ai'",
  'courseBuilderController',
  'recoverCourseMediaJobs',
  'getCourseMediaState',
  'publishPersistedCourseWithClient',
]) {
  if (!acceptance.includes(token)) failures.push(`ESB acceptance missing canonical invariant ${token}`);
}
for (const forbidden of ["mode: 'replace'", 'publish_course_from_staging']) {
  if (acceptance.includes(forbidden)) failures.push(`ESB acceptance bypasses canonical production path: ${forbidden}`);
}

const migration = requireFile('supabase/migrations/20260823174000_unify_course_media_jobs.sql');
for (const token of ['uq_video_jobs_canonical_asset', "COALESCE(asset_key, '')", 'retry_count', 'last_provider']) {
  if (!migration.includes(token)) failures.push(`canonical media migration missing ${token}`);
}

const renderer = requireFile('lib/video/process-video-job.ts');
for (const token of ['markComplete(job.id', 'markFailed(job.id', "provider: REMOTION_PROVIDER", 'generated.provider']) {
  if (!renderer.includes(token)) failures.push(`renderer does not preserve canonical job/provider evidence: ${token}`);
}

// Course media jobs may only be inserted by the approved low-level state module.
function walk(dir, out = []) {
  const abs = path.join(root, dir);
  if (!fs.existsSync(abs)) return out;
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    if (['node_modules', '.next', 'dist', 'build', 'archive'].includes(entry.name)) continue;
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(rel, out);
    else if (/\.(?:ts|tsx|js|mjs|cjs)$/.test(entry.name)) out.push(rel.split(path.sep).join('/'));
  }
  return out;
}
for (const rel of [...walk('apps'), ...walk('lib')]) {
  if (rel === 'lib/video/job-queue.ts') continue;
  const text = read(rel);
  if (/\.from\(['"]video_jobs['"]\)[\s\S]{0,240}\.insert\(/.test(text)) {
    failures.push(`${rel}: direct video_jobs insert bypasses canonical job state manager`);
  }
}

if (failures.length) {
  console.error('\nCOURSE MEDIA AUTHORITY GATE FAILED\n');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Course media authority verified: Course Factory owns retry/readiness, video_jobs is the single job identity, the renderer is policy-free/course-aware, Studio and ESB use the same media authority, and deprecated queue/publish bypasses are absent.');
