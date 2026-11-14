import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({
  data: [] as unknown[],
  error: null as { message: string } | null,
}));
vi.mock('@/lib/supabase/public', () => ({
  createPublicClient: () => {
    const query = {
      select: () => query,
      eq: () => query,
      order: () => query,
      limit: async () => ({ data: state.data, error: state.error }),
    };
    return { from: () => query };
  },
}));
import { getActiveJobs } from '@/lib/data/jobs';
beforeEach(() => {
  state.data = [];
  state.error = null;
});
describe('job data availability', () => {
  it('allows the public board to distinguish query failures from zero postings', async () => {
    state.error = { message: 'Connection failed' };
    await expect(getActiveJobs({ throwOnError: true })).rejects.toThrow('temporarily unavailable');
  });
  it('preserves existing callers that use an empty fallback on query failure', async () => {
    state.error = { message: 'Connection failed' };
    await expect(getActiveJobs()).resolves.toEqual([]);
  });
  it('still returns a genuinely empty successful query', async () => {
    await expect(getActiveJobs({ throwOnError: true })).resolves.toEqual([]);
  });
});
