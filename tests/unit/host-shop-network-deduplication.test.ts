import { describe, expect, it, vi } from 'vitest';
vi.mock('@/lib/programs/host-shops', () => ({ getApprovedShops: async () => [
  { id: 'historical', publicSlug: 'generations-hair-llc', name: 'Generations Hair LLC', address: '190 W Morgan St', city: 'Martinsville', state: 'IN', zip: '', phone: '', programs: [], description: 'Historical record without a pathway' },
  { id: 'current', publicSlug: 'generations-hair-llc', name: 'Generations Hair / Cat Eye Collective', address: '190 W Morgan St', city: 'Martinsville', state: 'IN', zip: '', phone: '', programs: ['cosmetology-apprenticeship'], primaryProgram: 'cosmetology-apprenticeship', description: 'Current cosmetology shop profile' },
] }));
import { getHostShopNetwork } from '@/lib/programs/host-shop-network';

describe('public shop destination consolidation', () => {
  it('shows one shop per profile while retaining its approved occupation', async () => {
    const shops = (await getHostShopNetwork()).filter((shop) => shop.slug === 'generations-hair-llc');
    expect(shops).toHaveLength(1);
    expect(shops[0].programs).toEqual(['cosmetology-apprenticeship']);
    expect(shops[0].primaryProgram).toBe('cosmetology-apprenticeship');
    expect(shops[0].description).toBe('Current cosmetology shop profile');
  });
});
