import { expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ shops: [] as Record<string, unknown>[] }));
vi.mock('@/lib/programs/host-shops', () => ({ getApprovedShops: async () => state.shops }));
import { getHostShopNetwork } from '@/lib/programs/host-shop-network';

const shop = (slug: string, name: string, videoUrl?: string) => ({ id: slug, publicSlug: slug, name, city: 'Indianapolis', state: 'IN', address: '', zip: '', phone: '', programs: ['cosmetology-apprenticeship'], videoUrl });
it('keeps a recorded Kountry Kutz tour on the native audio player', async () => {
  state.shops = [shop('kountry-kutz-barbershop', 'Kountry Kutz Barbershop')];
  const [result] = await getHostShopNetwork();
  expect(result.videoUrl).toBe('/videos/partners/kountry-kutz-tour.mp4');
  expect(result.videoScript).toBeUndefined();
});
it('retains narration intentionally authored for the selected Salon Saloon video', async () => {
  state.shops = [shop('salon-saloon', 'Salon Saloon')];
  const [result] = await getHostShopNetwork();
  expect(result.videoUrl).toBe('/videos/partners/salon-saloon-tour.mp4');
  expect(result.videoScript).toContain('Welcome to Salon Saloon');
});
it('does not reuse a curated narration when a different uploaded video is selected', async () => {
  state.shops = [shop('salon-saloon', 'Salon Saloon', '/uploaded-different-tour.mp4')];
  const [result] = await getHostShopNetwork();
  expect(result.videoUrl).toBe('/uploaded-different-tour.mp4');
  expect(result.videoScript).toBeUndefined();
});
