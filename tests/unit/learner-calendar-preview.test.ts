import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const state = vi.hoisted(() => ({ actor: 'admin' as string | null, previewing: true, filters: [] as unknown[][] }));
const query = (table: string) => {
  const builder: any = {
    select: () => builder,
    eq: (column: string, value: unknown) => { state.filters.push([table, column, value]); return builder; },
    gte: () => builder, lt: () => builder, order: () => builder, limit: () => builder,
    maybeSingle: async () => ({ data: null, error: null }),
    then: (resolve: any) => resolve({ data: [], error: null }),
  };
  return builder;
};
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: { getUser: async () => ({ data: { user: state.actor ? { id: state.actor } : null } }) }, from: (table: string) => query(table) }) }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => ({ from: (table: string) => query(table) }) }));
vi.mock('@/lib/admin/portal-preview', () => ({ resolvePortalPreviewSubject: async () => ({ previewing: state.previewing, userId: state.previewing ? 'selected-learner' : state.actor }) }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));
import { getCalendarEvents } from '@/lib/calendar/events-route';
beforeEach(() => { state.actor = 'admin'; state.previewing = true; state.filters = []; });
it('reads only the signed learner calendar and schedule during preview', async () => {
  const response = await getCalendarEvents(new NextRequest('https://app.test/api/calendar/events?userId=selected-learner&month=10&year=2026'));
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({ readOnly: true, events: [] });
  expect(state.filters).toContainEqual(['calendar_events', 'user_id', 'selected-learner']);
  expect(state.filters).toContainEqual(['apprenticeship_theory_schedules', 'user_id', 'selected-learner']);
  expect(state.filters.some(filter => filter[2] === 'admin')).toBe(false);
});
it('rejects a forged account ID even during a valid preview', async () => {
  const response = await getCalendarEvents(new NextRequest('https://app.test/api/calendar/events?userId=unrelated-learner'));
  expect(response.status).toBe(403);
  expect(state.filters).toHaveLength(0);
});
it('requires authentication outside a signed preview', async () => {
  state.actor = null; state.previewing = false;
  expect((await getCalendarEvents(new NextRequest('https://app.test/api/calendar/events'))).status).toBe(401);
});
it('does not let an ordinary learner request someone else’s calendar', async () => {
  state.actor = 'learner'; state.previewing = false;
  expect((await getCalendarEvents(new NextRequest('https://app.test/api/calendar/events?userId=another-learner'))).status).toBe(403);
});
