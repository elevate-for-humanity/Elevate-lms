import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('video worker expired lease recovery', () => {
  it('reclaims only expired rendering leases while retaining the canonical job', () => {
    const migration = readFileSync(
      join(
        process.cwd(),
        'supabase/migrations/20260913061000_reclaim_expired_video_leases.sql',
      ),
      'utf8',
    );

    expect(migration).toContain("v.status = 'rendering'");
    expect(migration).toContain('v.lease_expires_at <= now()');
    expect(migration).toContain('for update skip locked');
    expect(migration).toContain('where v.id = c.id');
    expect(migration).not.toContain('insert into public.video_jobs');
  });
});
