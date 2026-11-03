import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import TimeclockPage from '@/apps/lms/app/apprentice/timeclock/page';

const mocks = vi.hoisted(() => ({ router: { push: vi.fn() }, add: vi.fn(), sync: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => mocks.router }));
vi.mock('@/lib/pwa/offline-queue', () => ({ offlineQueue: { add: mocks.add, sync: mocks.sync } }));
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => {
    const query = { select: () => query, eq: () => query, not: () => query, order: () => query,
      limit: () => Promise.resolve({ data: [] }) };
    return { from: () => query };
  },
}));

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.clearAllMocks(); });
function setup(getCurrentPosition: ReturnType<typeof vi.fn>, submit: ReturnType<typeof vi.fn>) {
  Object.defineProperty(navigator, 'geolocation', { configurable: true, value: { getCurrentPosition } });
  mocks.sync.mockResolvedValue({ synced: 0, failed: 0 });
  const context = { apprenticeId: 'learner', canClock: true, programId: 'program',
    defaultSiteId: 'site', allowedSites: [{ id: 'site', name: 'Host shop' }], hoursCompleted: 0,
    hoursRequired: 1500, weeklyOjlHours: 0, weeklyTheoryRecordedHours: 0, weeklyTheoryVerifiedHours: 0 };
  vi.stubGlobal('fetch', (url: string, options?: RequestInit) =>
    url.endsWith('/context') ? Promise.resolve(Response.json(context)) : submit(url, options));
  render(<TimeclockPage />);
}
it('explains denied location without submitting or queuing a punch', async () => {
  const submit = vi.fn();
  setup(vi.fn((_success, denied) => denied({ code: 1 })), submit);
  fireEvent.click(await screen.findByRole('button', { name: 'Clock In' }));
  expect(await screen.findByText(/Allow Location for this LMS site/)).toBeVisible();
  expect(submit).not.toHaveBeenCalled();
  expect(mocks.add).not.toHaveBeenCalled();
});
it('queues only the fresh position from the actual failed network request', async () => {
  const submit = vi.fn().mockRejectedValue(new TypeError('Network request failed'));
  setup(vi.fn(success => success({ coords: { latitude: 39.8, longitude: -86.1, accuracy: 12 } })), submit);
  fireEvent.click(await screen.findByRole('button', { name: 'Clock In' }));
  await screen.findByText(/saved on this device for staff review/);
  expect(submit).toHaveBeenCalledTimes(1);
  const pending = JSON.parse(mocks.add.mock.calls[0][0].body);
  expect(pending).toMatchObject({ apprentice_id: 'learner', action: 'clock_in', lat: 39.8, lng: -86.1,
    accuracy_m: 12, offline_submission: true });
  expect(Number.isFinite(Date.parse(pending.client_recorded_at))).toBe(true);
});
it('shows a server denial without queuing the rejected action', async () => {
  setup(vi.fn(success => success({ coords: { latitude: 39.8, longitude: -86.1, accuracy: 12 } })),
    vi.fn().mockResolvedValue(Response.json({ error: 'Outside geofence' }, { status: 403 })));
  fireEvent.click(await screen.findByRole('button', { name: 'Clock In' }));
  await waitFor(() => expect(screen.getByText('Outside geofence')).toBeVisible());
  expect(mocks.add).not.toHaveBeenCalled();
});
