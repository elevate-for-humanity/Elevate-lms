import { beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ calls: [] as unknown[][], error: null as unknown }));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => ({ from: (table: string) => {
  const query: any = {
    select: (fields: string) => { state.calls.push([table, 'select', fields]); return query; },
    eq: (field: string, value: unknown) => { state.calls.push([table, field, value]); return query; },
    order: () => query,
    then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data: [], error: state.error }).then(resolve),
  };
  return query;
} }) }));
import { getPublicBookingDirectory } from '@/lib/booking/public-directory';
beforeEach(() => { state.calls = []; state.error = null; });
it('exposes only presentation fields and explicitly opted-in staff', async () => {
  await expect(getPublicBookingDirectory()).resolves.toEqual({ appointmentTypes: [], staff: [], locations: [] });
  expect(state.calls).toContainEqual(['staff', 'accepts_appointments', true]);
  expect(state.calls).toContainEqual(['staff', 'select', 'id, name, title, avatar_url']);
  expect(state.calls).toContainEqual(['appointment_types', 'is_active', true]);
  expect(state.calls).toContainEqual(['locations', 'is_active', true]);
});
it('does not present a failed database read as an empty directory', async () => {
  state.error = { message: 'Unavailable' };
  await expect(getPublicBookingDirectory()).rejects.toThrow('unavailable');
});
