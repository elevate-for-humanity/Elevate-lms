import { describe, expect, it } from 'vitest';
import { getHostShopReadinessItems } from '@/lib/partners/host-shop-readiness';

const base = {
  partner: { verification_status: 'verified', mou_signed: true, onboarding_completed: true },
  onboardingPaths: { signMou: '/mou', documents: '/documents' },
  missingDocuments: [],
  pendingDocuments: [],
  documentsComplete: true,
  unconfiguredPrograms: [],
};

describe('host shop readiness', () => {
  it('returns no items for a complete shop', () => {
    expect(getHostShopReadinessItems(base)).toEqual([]);
  });

  it('lists every actionable blocker without hiding operational access', () => {
    const items = getHostShopReadinessItems({
      ...base,
      partner: { verification_status: 'pending', mou_signed: false, onboarding_completed: false },
      documentsComplete: false,
      missingDocuments: [{ document_type: 'ein_letter', document_name: 'EIN / W-9' }],
      pendingDocuments: [{ document_type: 'insurance', document_name: 'Liability insurance' }],
      unconfiguredPrograms: [{ programSlug: 'cosmetology-apprenticeship' }],
    });
    expect(items.map((item) => item.key)).toEqual([
      'verification',
      'mou',
      'document:ein_letter',
      'review:insurance',
      'standards',
    ]);
  });

  it('shows orientation only after documents are complete', () => {
    const items = getHostShopReadinessItems({ ...base, partner: { ...base.partner, onboarding_completed: false } });
    expect(items).toHaveLength(1);
    expect(items[0].key).toBe('orientation');
  });
});
