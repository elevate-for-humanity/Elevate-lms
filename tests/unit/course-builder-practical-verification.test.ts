import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), 'utf8');

describe('universal practical verification', () => {
  it('requires learner evidence, attestation, and authorized human review', () => {
    const learner = read('apps/lms/app/api/learner/practical-submissions/route.ts');
    const reviewer = read('lib/lms/course-practical-workflow.ts');
    expect(learner).toContain('learnerAttestation: z.literal(true)');
    expect(reviewer).toContain("action: 'request_expert_review'");
    expect(reviewer).toContain("'record_mastery'");
    expect(reviewer).toContain("'unlock_next'");
    expect(reviewer).toContain("'assign_remediation'");
  });

  it('prevents learners from self-approving under RLS', () => {
    const migration = read(
      'supabase/migrations/20260911090000_universal_practical_verification.sql',
    );
    expect(migration).toContain(
      "with check (learner_id = (select auth.uid()) and status = 'submitted')",
    );
    expect(migration).toContain('authorized reviewers create reviews');
  });
});
