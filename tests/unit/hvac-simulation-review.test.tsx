import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({ filters: [] as unknown[], error: null as unknown }));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ from: (table: string) => {
  m.filters.push(table);
  const q: any = { select: () => q, eq: (key: string, value: string) => { m.filters.push([key,value]); return q; },
    like: (key: string, value: string) => { m.filters.push([key,value]); return q; }, order: () => q,
    limit: async () => ({ error: m.error, data: [{ learner_id: 'assigned-learner', lesson_id: 'unknown',
      score: 90, attempts: 2, completed: true, updated_at: '2026-11-25', weak_objectives: [] }] }) };
  return q;
} }) }));
import HvacSimulationReview from '@/components/lms/HvacSimulationReview';
it('reads server scores through authenticated RLS and labels them separately from hours/certification', async () => {
  render(await HvacSimulationReview());
  expect(screen.getByRole('region', { name: 'HVAC simulation practice review' })).toBeVisible();
  expect(screen.getByText(/Best score: 90/)).toBeVisible();
  expect(screen.getByText(/do not verify physical hands-on hours or certification/)).toBeVisible();
  expect(m.filters).toContainEqual(['interaction_id', 'hvac-sim:%']);
  expect(m.filters).toContainEqual(['course_id','d48c61c4-8880-4d9d-9ab5-fab4dd51b201']);
});
it('does not present a failed evidence lookup as an empty or successful review', async () => {
  m.error = { message: 'unavailable' };
  await expect(HvacSimulationReview()).rejects.toThrow('could not be loaded');
});
