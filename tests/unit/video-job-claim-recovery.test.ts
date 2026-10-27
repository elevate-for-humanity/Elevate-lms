import fs from 'node:fs';
import path from 'node:path';

describe('video job durable-output recovery', () => {
  const migration = fs.readFileSync(
    path.join(
      process.cwd(),
      'supabase/migrations/20260922131500_preserve_active_video_quality_lease.sql',
    ),
    'utf8',
  );

  it('does not reconcile a renderer while its quality-review lease is live', () => {
    expect(migration).toContain("v.status = 'queued'");
    expect(migration).toContain("v.status = 'rendering'");
    expect(migration).toContain('v.lease_expires_at <= now()');
    expect(migration).not.toContain("where v.status in ('queued', 'rendering')");
  });

  it('continues to recover durable output after an expired rendering lease', () => {
    expect(migration).toMatch(
      /v\.status = 'rendering'[\s\S]*v\.lease_expires_at is not null[\s\S]*v\.lease_expires_at <= now\(\)/,
    );
    expect(migration).toContain("and nullif(btrim(v.video_url), '') is not null");
  });

  it('quality-checks an existing candidate before acquiring its promotion lease', () => {
    const verifier = fs.readFileSync(
      path.join(process.cwd(), 'scripts/course-builder/verify-existing-video-candidate.ts'),
      'utf8',
    );
    expect(verifier.indexOf('await enforceMediaQuality')).toBeLessThan(
      verifier.indexOf(".eq('review_status', 'pending_review')"),
    );
    expect(verifier).toContain(".eq('status', 'complete')");
    expect(verifier).toContain('await markComplete(');
  });
});
