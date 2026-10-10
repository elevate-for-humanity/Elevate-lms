import { describe, expect, it, vi, beforeEach } from 'vitest';

const state = vi.hoisted(() => ({ result: { data: [] as any[], error: null as unknown } }));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/supabase/admin', () => ({
  requireAdminClient: async () => {
    const query: any = {};
    for (const method of ['select', 'eq', 'is', 'contains', 'order', 'limit'])
      query[method] = () => query;
    query.abortSignal = async () => state.result;
    return { from: () => query };
  },
}));
import { getAdminDashboardHeroAssets } from '@/lib/admin/dashboard/get-hero-assets';

describe('Admin dashboard media boundary', () => {
  beforeEach(() => {
    state.result = { data: [], error: null };
  });
  it('uses saved media and its accessible description without accepting unsafe sources', async () => {
    state.result.data = [
      {
        id: 'real',
        title: 'Workshop',
        public_url: 'https://media.example.org/workshop.jpg',
        metadata: { alt: 'Technician checking equipment' },
      },
      { id: 'unsafe', title: 'Unsafe', public_url: 'javascript:alert(1)' },
      {
        id: 'credentials',
        title: 'Invalid',
        public_url: 'https://user:password@media.example.org/photo.jpg',
      },
    ];
    expect(await getAdminDashboardHeroAssets()).toEqual([
      {
        id: 'real',
        url: 'https://media.example.org/workshop.jpg',
        alt: 'Technician checking equipment',
      },
    ]);
  });
  it('does not fabricate pictures when Supabase fails or contains no selected media', async () => {
    expect(await getAdminDashboardHeroAssets()).toEqual([]);
    state.result = { data: [], error: new Error('unavailable') };
    expect(await getAdminDashboardHeroAssets()).toEqual([]);
  });
});
