import { describe, expect, it, vi } from 'vitest';
vi.mock('@/lib/programs/host-shops', () => ({ getApprovedShops: async () => [
  { id: 'dbo', publicSlug: 'dbo-hair-studios-cddf6115', name: 'DBO Hair Studios', address: '2626 W Washington Street', city: 'Indianapolis', state: 'IN', zip: '46222', phone: '3178224783', programs: ['cosmetology-apprenticeship'], description: 'DBO Hair Studios — Indianapolis, IN. Approved Elevate Host Site record for Cosmetology Apprenticeship.' },
] }));
import { getHostShopNetwork } from '@/lib/programs/host-shop-network';

describe('complete public shop promotion', () => {
  it('enriches an approved DBO application with its real team photos and booking link', async () => {
    const [shop] = await getHostShopNetwork();
    expect(shop.name).toBe('DBO Hair Studios');
    expect(shop.approval).toBe('approved');
    expect(shop.gallery).toHaveLength(3);
    expect(shop.gallery?.every((photo) => photo.url.includes('/dbo-hair-studios/'))).toBe(true);
    expect(shop.booking).toBe('https://www.dbohairstudios.com/book');
    expect(shop.description).toContain('Evelyn Estevez');
  });
  it('includes published businesses only when requested, without claiming placement approval', async () => {
    const approved = await getHostShopNetwork();
    expect(approved.every((shop) => shop.approval === 'approved')).toBe(true);
    const directory = await getHostShopNetwork(true);
    const barber = directory.find((shop) => shop.slug === 'barbershop-32');
    expect(barber?.approval).toBe('published-partner');
    expect(barber?.address).toContain('330 East Main Street');
    expect(barber?.programs).toEqual(['barber-apprenticeship']);
    expect(barber?.booking).toBe('https://www.vagaro.com/barbershop32');
    expect(directory.filter((shop) => shop.name === 'DBO Hair Studios')).toHaveLength(1);
    expect(directory.find((shop) => shop.slug === 'marvelouz-cutz')?.approval).toBe('published-partner');
  });
});
