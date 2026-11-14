import {randomUUID} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import {createClient} from '@supabase/supabase-js';
import {processUltimateJob} from '../lib/ultimate-course-builder/worker/process-job.ts';
import {createWorkerSupabaseFetch} from '../lib/ultimate-course-builder/worker/runtime-guards.mjs';

const attemptId = process.env.EXTERNAL_COURSE_ATTEMPT_ID;
if (!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(attemptId ?? ''))
  throw Error('EXACT_EXTERNAL_ATTEMPT_REQUIRED');
if (process.env.ULTIMATE_OWNER_PREVIEW_JOB_ID) throw Error('CONFLICTING_EXACT_WORKER_TARGETS');
const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw Error('WORKER_DATABASE_CONFIG_REQUIRED');
const db = createClient(url, key, {auth: {persistSession: false, autoRefreshToken: false},
  global: {fetch: createWorkerSupabaseFetch()}});
const workerId = 'modal-' + randomUUID();
const started = performance.now();
// The canonical runner owns heartbeats, fencing, caption/media integrity,
// checkpoint reuse, B2 output and publication. Never rebuild those here.
const result = await processUltimateJob(db, workerId);
if (!result.claimed) throw Error('EXTERNAL_ATTEMPT_NOT_CLAIMED');
const wallSeconds = (performance.now() - started) / 1000;
const resource = process.resourceUsage();
const usage = {
  wall_seconds: wallSeconds,
  allocated_cpu_seconds: wallSeconds * 2,
  allocated_memory_gib_seconds: wallSeconds * 4,
  // Node process only; FFmpeg and Chromium subprocess CPU/RSS are excluded.
  node_cpu_seconds: (resource.userCPUTime + resource.systemCPUTime) / 1e6,
  node_peak_rss_bytes: resource.maxRSS * 1024,
  job_id: result.jobId,
  lesson_completed: result.completed === true,
  preview_ready: result.previewReady === true,
  playback_accepted: false,
};
const reportPath = process.env.EXTERNAL_COURSE_RESULT_PATH;
if (!reportPath?.startsWith('/tmp/elevate-external-') || !reportPath.endsWith('/result.json'))
  throw Error('PRIVATE_EXECUTION_REPORT_PATH_REQUIRED');
// The parent settles only after this process and its renderer process group
// have terminated. A returned lease deadline can leave in-flight work alive.
await writeFile(reportPath, JSON.stringify({attemptId, workerId, usage}), {mode: 0o600, flag: 'wx'});
console.info(JSON.stringify({event: 'external_course_task_finished', attemptId, workerId, ...usage}));
if (result.error || (!result.completed && !result.previewReady))
  throw Error('EXTERNAL_LESSON_NOT_COMPLETE_CHECK_SAVED_FINDINGS');
