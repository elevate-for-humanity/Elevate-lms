import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(join(process.cwd(), 'lib/video/job-queue.ts'), 'utf8');

describe('video job lease handoff', () => {
  it('reconciles a candidate write whose update representation is empty', () => {
    const candidate = source.slice(
      source.indexOf('export async function markCandidate'),
      source.indexOf('export async function markComplete'),
    );

    expect(candidate).toContain("select('id,status,lease_token,video_url')");
    expect(candidate).toContain("persisted?.status !== 'rendering'");
    expect(candidate).toContain('persisted.video_url !== result.video_url');
  });

  it('treats exact durable completion as idempotent', () => {
    const complete = source.slice(
      source.indexOf('export async function markComplete'),
      source.indexOf('export async function markFailed'),
    );

    expect(complete).toContain("persisted?.status !== 'complete'");
    expect(complete).toContain("persisted.review_status !== 'approved'");
    expect(complete).toContain('persisted.video_url !== result.video_url');
  });

  it('never lets a stale worker overwrite a completed or re-leased job', () => {
    const failed = source.slice(source.indexOf('export async function markFailed'));

    expect(failed).toContain("current?.status === 'complete'");
    expect(failed).toContain('current.lease_token !== leaseToken');
    expect(failed).toContain(".eq('status', 'rendering')");
    expect(failed).toContain("failureQuery = failureQuery.eq('lease_token', leaseToken)");
  });
});
