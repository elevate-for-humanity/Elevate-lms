// @vitest-environment node

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');
const migration = read(
  'supabase/migrations/20260922021235_recover_course_media_paid_inference.sql',
);
const recovery = read('scripts/course-builder/recover-paid-narration-media.ts');
const workflow = read('.github/workflows/recover-existing-course-media.yml');

describe('course media paid-inference recovery', () => {
  it('provisions only the exact canonical Cloudflare course narration scope', () => {
    expect(migration).toContain("p_scope_key='course:'||p_course_id::text||':cloudflare-tts'");
    expect(migration).toContain("p_provider='cloudflare'");
    expect(migration).toContain("p_operation='lesson-video'");
    expect(migration).toContain('on conflict (scope_key) do nothing');
    expect(migration).toContain('250000, 1, 250000');
  });

  it('recovers only determinate renderer outcomes and retains a bounded retry ceiling', () => {
    const start = migration.indexOf('-- A Cloudflare narration request is recoverable');
    const end = migration.indexOf('select r.* into req', start);
    const recoveryBlock = migration.slice(start, end);
    expect(recoveryBlock).toContain(
      "r.status in ('dispatched','acknowledged','processing','failed')",
    );
    expect(recoveryBlock).not.toContain("'uncertain'");
    expect(recoveryBlock).not.toContain("'reconciling'");
    expect(recoveryBlock).toContain("when r.dispatch_attempts<3 then 'approved' else 'failed'");
    expect(recoveryBlock).toContain("else 'retry_exhausted'");
  });

  it('requires an expired lease or a provably newer attempt before recovery', () => {
    expect(migration).toContain("v.status='rendering'");
    expect(migration).toContain('v.lease_expires_at>now()');
    expect(migration).toContain('r.job_id=p_job_id');
    expect(migration).toContain('v.started_at>r.updated_at');
  });

  it('reconciles a durable video output instead of repurchasing narration', () => {
    expect(migration).toContain('reconciled_from_durable_video_output');
    expect(migration).toContain("coalesce(btrim(v.video_url),'')<>''");
    expect(migration).toContain('l.provider_request_id=r.id');
    expect(migration).toContain("set status='completed'");
  });

  it('ties course narration capacity to a live canonical renderer lease', () => {
    const start = migration.indexOf('-- Course narration owns capacity');
    const end = migration.indexOf('if (pol.per_request_limit_micros', start);
    const activeBlock = migration.slice(start, end);
    expect(activeBlock).toContain(
      "r.status in ('approved','dispatched','acknowledged','processing','uncertain','reconciling')",
    );
    expect(activeBlock).toContain("r.provider<>'cloudflare'");
    expect(activeBlock).toContain("r.operation<>'lesson-video'");
    expect(activeBlock).toContain("v.status='rendering'");
    expect(activeBlock).toContain('v.lease_expires_at>now()');
  });

  it('preserves pause, budget, concurrency, and service-role gates', () => {
    expect(migration).toContain('if pol.paused then');
    expect(migration).toContain("return query select 'budget_exceeded'");
    expect(migration).toContain('active_count>=pol.max_active_requests');
    expect(migration).toContain('from public,anon,authenticated');
    expect(migration).toContain('to service_role');
  });

  it('selects only failed jobs with no final video', () => {
    expect(recovery).toContain(".eq('status', 'failed')");
    expect(recovery).toContain(".is('video_url', null)");
    expect(recovery).toContain('Paid media authorization blocked: provider_unavailable');
    expect(recovery).toContain('Paid media authorization blocked: retry_exhausted');
  });

  it('refuses active courses and never invokes the broad course queue builder', () => {
    expect(recovery).toContain("course.status === 'published' || course.is_active");
    expect(recovery).toContain('sourceRepaired: true');
    expect(recovery).toContain('completedMediaTouched: 0');
    expect(recovery).not.toContain('queueCourseLessonVideos');
  });

  it('defaults to a one-job canary and waits for canonical audiovisual QA', () => {
    expect(workflow).toContain('default: canary');
    expect(workflow).toContain('args+=(--limit 1)');
    expect(workflow).toContain('wait-for-media-job.ts');
    expect(workflow).toContain('--timeout-minutes 45');
  });

  it('requires full-package verification and never publishes a course', () => {
    expect(workflow).toContain('verify-course-media.ts');
    expect(workflow).toContain("inputs.mode == 'full'");
    expect(workflow).not.toMatch(/publish[-_: ]course/i);
    expect(workflow).toContain('No course was published by this workflow.');
  });
});
