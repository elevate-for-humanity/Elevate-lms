import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { CalendarWidget } from '@/components/CalendarWidget';
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
it('shows confirmed appointments on their date and loads another calendar month', async () => {
  const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ events: [] }) });
  vi.stubGlobal('fetch', fetcher);
  const start = new Date();
  start.setDate(12);
  start.setHours(10, 0, 0, 0);
  render(
    <CalendarWidget
      userId="student-1"
      additionalEvents={[
        {
          id: 'meeting-1',
          title: 'Bookkeeping appointment',
          date: '',
          startsAt: start.toISOString(),
          type: 'class',
        },
      ]}
    />,
  );
  fireEvent.click(
    screen.getByRole('button', { name: start.toLocaleDateString('en-US', { dateStyle: 'full' }) }),
  );
  expect(await screen.findByText('Bookkeeping appointment')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
  expect(fetcher.mock.calls.filter(call => String(call[0]).startsWith('/api/calendar/events?'))).toHaveLength(2);
});
it('reports calendar loading failures rather than presenting an empty calendar as success', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
  render(<CalendarWidget userId="student-1" />);
  expect((await screen.findAllByRole('alert')).some(alert => alert.textContent?.includes('Calendar events could not be loaded'))).toBe(true);
});
it('shows a Google all-day busy block on each occupied local day but excludes its end date', async () => {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 12);
  const middle = new Date(today.getFullYear(), today.getMonth(), 13);
  const end = new Date(today.getFullYear(), today.getMonth(), 14);
  vi.stubGlobal('fetch', vi.fn(async (url: string) => ({ ok: true, json: async () => url === '/api/calendar/google'
    ? { configured: true, connected: true }
    : { events: url.startsWith('/api/calendar/google?') ? [{ id: 'google-busy', title: 'Google Calendar · Busy', date: '', type: 'event', startsAt: start.toISOString(), endsAt: end.toISOString(), source: 'google' }] : [] },
  })));
  render(<CalendarWidget userId="owner" />);
  await screen.findByText(/Connected. Busy times/);
  fireEvent.click(screen.getByRole('button', { name: middle.toLocaleDateString('en-US', { dateStyle: 'full' }) }));
  expect(await screen.findByText('Google Calendar · Busy')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: end.toLocaleDateString('en-US', { dateStyle: 'full' }) }));
  expect(screen.queryByText('Google Calendar · Busy')).toBeNull();
});
