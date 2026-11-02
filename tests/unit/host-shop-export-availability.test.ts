// @vitest-environment node
import { expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
vi.mock('@/lib/auth/require-role', () => ({
  requireRole: async () => ({ user: { id: 'owner' } }),
}));
vi.mock('@/lib/partner/board', () => ({
  getHostShopBoard: async () => ({ unavailableData: ['work hours'] }),
}));
vi.mock('@/lib/supabase/admin', () => ({
  requireAdminClient: vi.fn(() => {
    throw new Error('Export must stop before querying');
  }),
}));
import { GET } from '@/apps/lms/app/api/host-shop/reports/export/route';
it.each(['overview', 'apprentices', 'progress', 'hours', 'attendance', 'compliance'])(
  'blocks a misleading %s export when source records failed to load',
  async (type) => {
    const response = await GET(
      new NextRequest('https://school.example/api/host-shop/reports/export?type=' + type),
    );
    expect(response.status).toBe(503);
    expect((await response.json()).error).toContain('Retry before exporting');
  },
);
