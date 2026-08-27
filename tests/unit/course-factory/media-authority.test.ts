// @vitest-environment node

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// Static contracts prevent Studio, Course Factory, and the renderer from
// regaining overlapping media authority as their implementations evolve.
const root = process.cwd();
const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = (rel: string) => fs.existsSync(path.join(root, rel));

describe('canonical Course Factory media architecture', () => {
  it('removes the deprecated Course Builder video queue facade', () => {
    expect(exists('lib/course-builder/video-queue.ts')).toBe(false);
  });

  it('enforces one canonical DB identity including nullable lesson asset keys', () => {
    const migration = read('supabase/migrations/20260823174000_unify_course_media_jobs.sql');
    expect(migration).toContain('uq_video_jobs_canonical_asset');
    expect(migration).toContain("COALESCE(asset_kind, 'lesson')");
    expect(migration).toContain("COALESCE(asset_key, '')");
  });

  it('makes concurrent canonical creates converge on the database winner', () => {
    const queue = read('lib/video/job-queue.ts');
    expect(queue).toContain('findCanonicalJob');
    expect(queue).toContain("error?.code === '23505'");
    expect(queue).toContain('return winner');
  });

  it('does not keep a lesson-only reset helper', () => {
    const queue = read('lib/video/job-queue.ts');
    expect(queue).not.toMatch(/export async function resetJob\s*\(/);
    const manager = read('lib/course-factory/media-manager.ts');
    expect(manager).toContain('resetCanonicalMediaJob');
    expect(manager).toContain('assetKey?: string | null');
  });

  it('keeps completed jobs unless an authorized force repair is requested', () => {
    const manager = read('lib/course-factory/media-manager.ts');
    expect(manager).toContain("job.status === 'complete' && !options.force");
  });

  it('caps retries and applies retry backoff', () => {
    const manager = read('lib/course-factory/media-manager.ts');
    expect(manager).toContain('COURSE_MEDIA_MAX_RETRIES = 3');
    expect(manager).toContain('courseMediaRetryDelayMs');
    expect(manager).toContain('Retry limit reached');
    expect(manager).toContain('Retry backoff has not elapsed');
  });

  it('recovers stale rendering through Course Factory rather than the renderer route', () => {
    const manager = read('lib/course-factory/media-manager.ts');
    const worker = read('apps/admin/app/api/internal/videos/process-queue/route.ts');
    expect(manager).toContain('COURSE_MEDIA_STALE_RENDER_MS');
    expect(manager).toContain('Recovered stale rendering job through Course Factory policy');
    expect(worker).not.toContain('staleBefore');
    expect(worker).not.toContain('retried403');
    expect(worker).not.toContain('Unexpected server response: 403');
  });

  it('preserves microclip asset_key during retry', () => {
    const manager = read('lib/course-factory/media-manager.ts');
    expect(manager).toContain('assetKey: row.asset_key');
    expect(manager).toContain("String(clip.id) === identity.assetKey");
  });

  it('resets retry evidence without violating the production NOT NULL contract', () => {
    const manager = read('lib/course-factory/media-manager.ts');
    expect(manager).toContain('quality_evidence: {}');
    expect(manager).not.toContain('quality_evidence: null');
  });

  it('uses one global renderer with optional course-scoped candidate selection', () => {
    const worker = read('apps/admin/app/api/internal/videos/process-queue/route.ts');
    expect(worker).toContain('requestedOptions');
    expect(worker).toContain('maxJobs ?? maxConcurrent');
    expect(worker).toContain("candidateQuery.eq('course_id', courseId)");
    expect(worker).toContain('processClaimedVideoJob(job)');
    expect(worker).toContain('activeBeforeClaim');
  });

  it('allows an authenticated ESB acceptance run to promote only one draft asset', () => {
    const worker = read('apps/admin/app/api/internal/videos/process-queue/route.ts');
    const workflow = read('.github/workflows/esb-video-recovery-test.yml');
    expect(worker).toContain('queueOneDraft requires an exact courseId and maxJobs=1');
    expect(worker).toContain(".eq('status', 'draft')");
    expect(worker).toContain(".eq('status', 'queued')");
    expect(workflow).toContain('"queueOneDraft":true');
    expect(workflow).toContain('result.started !== 1');
  });

  it('keeps render capacity global during course-scoped runs', () => {
    const worker = read('apps/admin/app/api/internal/videos/process-queue/route.ts');
    const activeBlock = worker.slice(worker.indexOf('activeCount'), worker.indexOf('availableSlots'));
    expect(activeBlock).not.toContain("eq('course_id', courseId)");
  });

  it('keeps GPU fallback and Remotion on the same canonical job identity', () => {
    const renderer = read('lib/video/process-video-job.ts');
    expect(renderer).toContain('GPU scene failed; falling back to Remotion');
    expect(renderer).toContain('markComplete(job.id');
    expect(renderer).toContain('markFailed(job.id');
    expect(renderer).not.toMatch(/createJob\s*\(/);
  });

  it('records renderer provider evidence on terminal state', () => {
    const renderer = read('lib/video/process-video-job.ts');
    expect(renderer).toContain('provider: generated.provider');
    expect(renderer).toContain('provider: REMOTION_PROVIDER');
    expect(renderer).toContain('provider_model: REMOTION_MODEL');
  });

  it('rejects missing and unreachable media from Course Factory readiness', () => {
    const manager = read('lib/course-factory/media-manager.ts');
    expect(manager).toContain("row.status === 'complete' && Boolean(row.video_url)");
    expect(manager).toContain('unreachable.length === 0');
    expect(manager).toContain("Range: 'bytes=0-1023'");
  });

  it('rejects canonical/persisted lesson and microclip state disagreement', () => {
    const manager = read('lib/course-factory/media-manager.ts');
    expect(manager).toContain('lessonStateMismatches === 0');
    expect(manager).toContain('microclipStateMismatches === 0');
  });

  it('keeps ESB acceptance fixed to 35 lesson videos and 70 microclips', () => {
    const acceptance = read('scripts/course-factory/build-esb-acceptance.ts');
    expect(acceptance).toContain('EXPECTED_MAIN_VIDEOS = 35');
    expect(acceptance).toContain('EXPECTED_MICROCLIPS = 70');
    expect(acceptance).toContain('EXPECTED_MEDIA = 105');
  });

  it('authorizes course-scoped recovery for Business acceptance without replacing completed assets', () => {
    const acceptance = read('scripts/course-factory/build-business-program.ts');
    expect(acceptance).toContain("recoverCourseMediaJobs({ courseId, force: true })");
    expect(acceptance).toContain('Authorized media recovery left blocked jobs');
    expect(acceptance).toContain('EXPECTED_MAIN_VIDEOS = 35');
    expect(acceptance).toContain('EXPECTED_MICROCLIPS = 70');
  });

  it('normalizes packaged instructor paths to a durable URL before Remotion rendering', () => {
    const root = read('remotion-src/Root.tsx');
    expect(root).toContain("props.instructorImageSrc?.startsWith('/')");
    expect(root).toContain('CANONICAL_INSTRUCTOR_IMAGE_URL');
    expect(root).toContain('cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images');
  });

  it('refreshes the existing ESB course through AI and never replaces its identity', () => {
    const acceptance = read('scripts/course-factory/build-esb-acceptance.ts');
    expect(acceptance).toContain("mode: 'refresh'");
    expect(acceptance).toContain("contentSource: 'ai'");
    expect(acceptance).not.toContain("mode: 'replace'");
    expect(acceptance).toContain("build.courseId !== COURSE_ID");
  });

  it('uses the same Course Factory media state in Studio and ESB acceptance', () => {
    const executor = read('lib/agentic/course-executor.ts');
    const acceptance = read('scripts/course-factory/build-esb-acceptance.ts');
    expect(executor).toContain('getCourseMediaState');
    expect(acceptance).toContain('getCourseMediaState');
    expect(executor).not.toMatch(/async function courseMediaState\s*\(/);
  });

  it('blocks Studio publication until canonical media is complete', () => {
    const executor = read('lib/agentic/course-executor.ts');
    expect(executor).toContain('if (!media.completePackage)');
    expect(executor).toContain('Publication blocked: canonical media package incomplete');
  });

  it('publishes ESB only through the canonical persisted Course Builder publisher', () => {
    const acceptance = read('scripts/course-factory/build-esb-acceptance.ts');
    expect(acceptance).toContain('publishPersistedCourseWithClient');
    expect(acceptance).not.toContain('publish_course_from_staging');
  });
});
