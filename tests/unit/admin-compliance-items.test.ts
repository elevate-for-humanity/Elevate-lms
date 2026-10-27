import { describe, expect, it } from 'vitest';

import { attachComplianceEvidence } from '@/lib/admin/compliance-items';

describe('attachComplianceEvidence', () => {
  it('joins evidence without relying on a PostgREST foreign-key relationship', () => {
    const result = attachComplianceEvidence(
      [
        { id: 'item-1', title: 'FERPA review', category: 'privacy', status: 'pending', description: null, last_reviewed_at: null },
        { id: 'item-2', title: 'WIOA review', category: 'workforce', status: 'compliant', description: null, last_reviewed_at: null },
      ],
      [
        { id: 'evidence-1', item_id: 'item-1', file_url: 'https://example.test/evidence.pdf', file_name: 'evidence.pdf', created_at: '2026-09-04T00:00:00.000Z' },
      ],
    );
    expect(result[0].compliance_evidence).toEqual([
      { id: 'evidence-1', file_url: 'https://example.test/evidence.pdf', file_name: 'evidence.pdf', uploaded_at: '2026-09-04T00:00:00.000Z' },
    ]);
    expect(result[1].compliance_evidence).toEqual([]);
  });
});
