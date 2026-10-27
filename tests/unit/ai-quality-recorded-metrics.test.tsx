import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
const state = vi.hoisted(() => ({ error: false }));
vi.mock('@/lib/auth/require-role', () => ({ requireRole: async () => ({}) }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => ({ from: () => {
  const q: any = { select: () => q, eq: () => q, order: () => q, range: () => q,
    then: (resolve: (value: unknown) => unknown) => Promise.resolve({ count: 7, error: state.error ? { message: 'Unavailable' } : null, data: [
      { agent_id: 'paris', quality_score: 3, started_at: '2026-10-27T10:00:00Z', completed_at: '2026-10-27T10:00:02Z' },
      { agent_id: 'paris', quality_score: 5, started_at: '2026-10-27T10:00:00Z', completed_at: '2026-10-27T10:00:06Z' },
    ] }).then(resolve),
  }; return q;
} }) }));
import AIQualityPage from '@/apps/admin/app/paris/quality/page';
beforeEach(() => { state.error = false; });
afterEach(cleanup);
it('derives response time and quality from recorded tasks and does not estimate staff outcomes', async () => {
  render(await AIQualityPage());
  expect(screen.getByText('4.0s')).toBeInTheDocument();
  expect(screen.getByText('4.0/5')).toBeInTheDocument();
  expect(screen.getByText('Completed Tasks')).toBeInTheDocument();
  expect(screen.getByText(/Resolution statistics are unavailable/)).toBeInTheDocument();
  expect(screen.queryByText('Resolved by Staff')).not.toBeInTheDocument();
  expect(screen.queryByText('Helpful Rate')).not.toBeInTheDocument();
});
it('does not substitute zero metrics when records cannot be read', async () => {
  state.error = true;
  await expect(AIQualityPage()).rejects.toBeTruthy();
});
