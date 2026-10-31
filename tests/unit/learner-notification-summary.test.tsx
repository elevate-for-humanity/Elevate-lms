import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
vi.mock('next/navigation', () => ({ usePathname: () => '/lms/dashboard' }));
vi.mock('@/components/notifications/PwaAlertListener', () => ({ PwaAlertListener: () => null }));
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => {
    const query: Record<string, unknown> = {};
    for (const method of ['select', 'eq', 'in', 'or', 'order']) query[method] = () => query;
    query.limit = async () => ({
      data: [{ id: 'notice', title: 'Course reminder', message: 'Review your assignment' }],
    });
    const channel = { on: () => channel, subscribe: () => channel };
    return {
      auth: {
        getUser: async () => ({ data: { user: { id: 'student' } } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      from: () => query,
      channel: () => channel,
      removeChannel: async () => {},
    };
  },
}));
import { CommunicationTodos } from '@/components/communications/CommunicationTodos';
afterEach(cleanup);
it('keeps student reminders behind a summary without losing the message or email link', async () => {
  const { container } = render(<CommunicationTodos />);
  expect(await screen.findByText('Messages and reminders (1)')).toBeInTheDocument();
  expect(container.querySelector('details')?.open).toBe(false);
  expect(screen.getByText('Course reminder')).not.toBeVisible();
  expect(screen.getByRole('link', { name: 'Interoffice email', hidden: true })).toHaveAttribute(
    'href',
    '/communications/email',
  );
});
