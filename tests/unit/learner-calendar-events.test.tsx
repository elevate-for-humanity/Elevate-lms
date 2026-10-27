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
  expect(fetcher).toHaveBeenCalledTimes(2);
});
it('reports calendar loading failures rather than presenting an empty calendar as success', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
  render(<CalendarWidget userId="student-1" />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Calendar events could not be loaded');
});
