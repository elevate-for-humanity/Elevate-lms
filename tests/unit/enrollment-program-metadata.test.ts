import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const state = vi.hoisted(() => ({
  row: null as Record<string, unknown> | null,
  error: null as unknown,
  select: vi.fn(),
  eq: vi.fn(),
}));
vi.mock('@/lib/supabase/admin', () => ({
  requireAdminClient: async () => ({
    from: () => {
      const query = {
        select: (columns: string) => { state.select(columns); return query; },
        eq: (key: string, value: unknown) => { state.eq(key, value); return query; },
        maybeSingle: async () => ({ data: state.row, error: state.error }),
      };
      return query;
    },
  }),
}));
vi.mock('@/lib/partners/enchanted-hearts', () => ({ ENCHANTED_HEARTS: { programs: [] } }));

import { GET } from '../../apps/marketing/app/api/enroll/program/[id]/route';

const get = (id = 'nail-technician-apprenticeship') => GET(
  new NextRequest(`https://example.test/api/enroll/program/${id}`),
  { params: Promise.resolve({ id }) },
);

describe('public enrollment program metadata', () => {
  beforeEach(() => {
    state.row = {
      id: 'program-id', slug: 'nail-technician-apprenticeship',
      title: 'Nail Technician Apprenticeship', name: null,
      duration_weeks: null, price: 6000, total_cost: 6000,
      is_free: false, funding_eligible: false,
    };
    state.error = null;
    vi.clearAllMocks();
  });

  it('returns the canonical title when the legacy name is null', async () => {
    const response = await get();
    expect(response.status).toBe(200);
    expect((await response.json()).program).toMatchObject({
      name: 'Nail Technician Apprenticeship', duration_weeks: null,
      price: 6000, total_cost: 6000, funding_eligible: false,
    });
    expect(state.select.mock.calls[0][0].split(',')).toContain('title');
    expect(state.eq).toHaveBeenCalledWith('published', true);
    expect(state.eq).toHaveBeenCalledWith('is_active', true);
  });

  it('retains an existing explicit name', async () => {
    state.row!.name = 'Published enrollment name';
    expect((await (await get()).json()).program.name).toBe('Published enrollment name');
  });

  it('does not expose the internal title field', async () => {
    expect((await (await get()).json()).program).not.toHaveProperty('title');
  });

  it('still rejects missing programs and database failures', async () => {
    state.row = null;
    expect((await get()).status).toBe(404);
    state.error = new Error('private database details');
    const response = await get();
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('private database details');
  });
});
