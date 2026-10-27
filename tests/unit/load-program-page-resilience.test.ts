import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createPublicClient } = vi.hoisted(() => ({ createPublicClient: vi.fn() }));

vi.mock('@/lib/supabase/public', () => ({ createPublicClient }));

import { loadProgramForPage } from '@/lib/programs/load-program-page';

function programQuery(result: { data: unknown; error: unknown }) {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    neq: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue(result),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.neq.mockReturnValue(query);
  return query;
}

describe('public program page availability', () => {
  beforeEach(() => {
    createPublicClient.mockReset();
  });

  it('uses the exact governed static record during a Supabase outage', async () => {
    const query = programQuery({ data: null, error: { message: 'upstream unavailable' } });
    createPublicClient.mockReturnValue({ from: vi.fn().mockReturnValue(query) });

    const loaded = await loadProgramForPage('cdl-training');

    expect(loaded?.program.slug).toBe('cdl-training');
    expect(loaded?.synthesized).toBe(false);
  });

  it('keeps a confirmed missing publication unavailable', async () => {
    const query = programQuery({ data: null, error: null });
    createPublicClient.mockReturnValue({ from: vi.fn().mockReturnValue(query) });

    await expect(loadProgramForPage('cdl-training')).resolves.toBeNull();
  });

  it('fails closed for an unknown slug when Supabase is unavailable', async () => {
    createPublicClient.mockReturnValue(null);

    await expect(loadProgramForPage('not-a-governed-program')).resolves.toBeNull();
  });
});
