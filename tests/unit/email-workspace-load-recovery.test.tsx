import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { EmailWorkspace } from '@/components/communications/EmailWorkspace';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it('reports a failed mailbox request and retries instead of claiming no mailbox exists', async () => {
  const fetch = vi.fn()
    .mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Mailbox service unavailable' }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ mailboxes: [] }) });
  vi.stubGlobal('fetch', fetch);
  render(<EmailWorkspace roleLabel="Apprentice" />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Mailbox service unavailable');
  expect(screen.queryByText('No active Elevate mailbox')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Retry email' }));
  expect(await screen.findByText('No active Elevate mailbox')).toBeInTheDocument();
  expect(fetch).toHaveBeenCalledTimes(2);
});
