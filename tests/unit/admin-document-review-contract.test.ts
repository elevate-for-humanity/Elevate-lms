import { readFileSync } from 'node:fs';

const route = readFileSync(
  'apps/admin/app/api/admin/documents/review/route.ts',
  'utf8',
);
const form = readFileSync('components/admin/DocumentReviewForm.tsx', 'utf8');
const migration = readFileSync(
  'supabase/migrations/20260908094000_review_document_transaction.sql',
  'utf8',
);

describe('admin document review contract', () => {
  it('maps approval to the database verification enum and records the verifier', () => {
    expect(route).toContain("'review_document_with_audit'");
    expect(migration).toContain("verification_status = case when p_action = 'approve' then 'verified' else 'rejected' end");
    expect(migration).toContain('insert into public.audit_logs');
    expect(migration).toContain("set search_path = ''");
  });

  it('requires a reason for rejection', () => {
    expect(route).toContain("action === 'reject' && !String(rejectionReason || '').trim()");
  });

  it('does not mask a useful API error in the review form', () => {
    expect(form).toContain("err instanceof Error ? err.message : 'Failed to review document'");
  });
});
