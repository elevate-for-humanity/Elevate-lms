import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  path.join(
    process.cwd(),
    'supabase/migrations/20260826181500_notify_program_holder_on_enrollment.sql',
  ),
  'utf8',
);

describe('Program Holder enrollment notification contract', () => {
  it('notifies after the canonical assignment trigger has populated the holder', () => {
    expect(migration).toContain('after insert or update of program_holder_id');
    expect(migration).toContain("'/program-holder/students'");
    expect(migration).toContain("'New Student Assigned'");
  });

  it('is idempotent without replacing the canonical enrollment RPC', () => {
    expect(migration).toContain('on conflict (idempotency_key) do nothing');
    expect(migration).not.toContain('create or replace function rpc_enroll_student');
  });
});
