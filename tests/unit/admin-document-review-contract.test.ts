import { readFileSync } from 'node:fs';

const route = readFileSync(
  'apps/admin/app/api/admin/documents/review/route.ts',
  'utf8',
);
const form = readFileSync('components/admin/DocumentReviewForm.tsx', 'utf8');

describe('admin document review contract', () => {
  it('maps approval to the database verification enum and records the verifier', () => {
    expect(route).toContain("action === 'approve' ? 'verified' : 'rejected'");
    expect(route).toContain("verified_by: action === 'approve' ? auth.id : null");
    expect(route).not.toContain('verification_status: status');
  });

  it('requires a reason for rejection', () => {
    expect(route).toContain("action === 'reject' && !String(rejectionReason || '').trim()");
  });

  it('does not mask a useful API error in the review form', () => {
    expect(form).toContain("err instanceof Error ? err.message : 'Failed to review document'");
  });
});
