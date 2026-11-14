import { afterEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { EmailWorkspace } from '@/components/communications/EmailWorkspace';

const mailbox = {
  id: 'admissions',
  address: 'admissions@example.org',
  displayName: 'Admissions',
  mailboxKind: 'department',
  accessLevel: 'owner',
};
const thread = {
  id: 'conversation-a',
  subject: 'Enrollment question',
  last_message_at: '2026-11-14T00:00:00Z',
  message_count: 1,
  unread: true,
  starred: false,
  folder: 'inbox',
  sender: 'Applicant',
  preview: 'Can we discuss the next class?',
};
const base = {
  mailboxes: [mailbox],
  selectedMailboxId: mailbox.id,
  filters: [],
  folders: [],
  drafts: [],
  threads: [thread],
};
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.history.replaceState({}, '', '/');
});

it('keeps search and mailbox actions from reopening a cleared conversation after refresh', async () => {
  window.history.replaceState({}, '', '/email?threadId=conversation-a&mailboxId=admissions');
  const fetchMock = vi.fn(async (input: string, init?: RequestInit) => {
    if (init?.method === 'PATCH') return { ok: true, json: async () => ({ success: true }) };
    const url = new URL(input, window.location.origin);
    return {
      ok: true,
      json: async () => ({
        ...base,
        selectedThread: url.searchParams.has('threadId') ? { ...thread, messages: [] } : null,
      }),
    };
  });
  vi.stubGlobal('fetch', fetchMock);
  render(<EmailWorkspace initialMailboxId="admissions" initialThreadId="conversation-a" />);
  await screen.findByRole('heading', { name: thread.subject });
  fireEvent.change(screen.getByRole('textbox', { name: 'Search mail' }), {
    target: { value: 'class' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Search messages' }));
  await screen.findByRole('heading', { name: 'Select a conversation' });
  expect(new URL(window.location.href).searchParams.get('threadId')).toBeNull();
  expect(new URL(window.location.href).searchParams.get('mailboxId')).toBe('admissions');
  expect(screen.getByText('Applicant')).toBeInTheDocument();
  expect(screen.getByText('Can we discuss the next class?')).toBeInTheDocument();
});

it('does not let an older mailbox response replace the current mailbox or its deep link', async () => {
  let resolveOld!: (value: unknown) => void;
  let calls = 0;
  vi.stubGlobal(
    'fetch',
    vi.fn(() => {
      calls++;
      if (calls === 2)
        return new Promise((resolve) => {
          resolveOld = resolve;
        });
      return Promise.resolve({ ok: true, json: async () => ({ ...base, selectedThread: null }) });
    }),
  );
  render(<EmailWorkspace />);
  await screen.findByText('Enrollment question');
  fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
  fireEvent.click(screen.getByRole('button', { name: 'Sent', exact: true }));
  await waitFor(() =>
    expect(new URL(window.location.href).searchParams.get('mailboxId')).toBe('admissions'),
  );
  await act(async () => {
    resolveOld({
      ok: true,
      json: async () => ({
        ...base,
        selectedMailboxId: 'stale-private-box',
        selectedThread: { ...thread, messages: [] },
      }),
    });
  });
  await waitFor(() =>
    expect(screen.queryByRole('heading', { name: thread.subject })).not.toBeInTheDocument(),
  );
  expect(new URL(window.location.href).searchParams.get('mailboxId')).toBe('admissions');
});

it('restores the saved folder and search when the PWA reloads', async () => {
  window.history.replaceState({}, '', '/email?view=sent&q=class&mailboxId=admissions');
  const fetchMock = vi.fn(async (_input: string) => ({
    ok: true,
    json: async () => ({ ...base, selectedThread: null }),
  }));
  vi.stubGlobal('fetch', fetchMock);
  render(<EmailWorkspace initialMailboxId="admissions" />);
  await screen.findByRole('heading', { name: 'Sent' });
  expect(screen.getByRole('textbox', { name: 'Search mail' })).toHaveValue('class');
  const request = new URL(String(fetchMock.mock.calls[0][0]), window.location.origin);
  expect(request.searchParams.get('view')).toBe('sent');
  expect(request.searchParams.get('q')).toBe('class');
});

it('reports a read-status failure instead of silently ignoring it', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string, init?: RequestInit) => {
      if (init?.method === 'PATCH')
        return { ok: false, json: async () => ({ error: 'Unavailable' }) };
      const url = new URL(input, window.location.origin);
      return {
        ok: true,
        json: async () => ({
          ...base,
          selectedThread: url.searchParams.has('threadId') ? { ...thread, messages: [] } : null,
        }),
      };
    }),
  );
  render(<EmailWorkspace />);
  fireEvent.click(await screen.findByRole('button', { name: /Applicant.*Enrollment question/ }));
  expect(await screen.findByRole('alert')).toHaveTextContent('read status could not be saved');
});

it('does not mark a conversation read when opening it fails', async () => {
  const fetchMock = vi.fn(async (input: string) => {
    const url = new URL(input, window.location.origin);
    return url.searchParams.has('threadId')
      ? { ok: false, json: async () => ({ error: 'Conversation unavailable' }) }
      : { ok: true, json: async () => ({ ...base, selectedThread: null }) };
  });
  vi.stubGlobal('fetch', fetchMock);
  render(<EmailWorkspace />);
  fireEvent.click(await screen.findByRole('button', { name: /Applicant.*Enrollment question/ }));
  await screen.findByText('Conversation unavailable');
  expect(new URL(window.location.href).searchParams.get('threadId')).toBeNull();
  expect(fetchMock).toHaveBeenCalledTimes(2);
});
