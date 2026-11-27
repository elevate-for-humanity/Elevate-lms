import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import UnifiedEllieChat from '@/components/studio/UnifiedEllieChat';
import { streamPlatformChat } from '@/lib/devstudio/ellie-unified-handlers';

vi.mock('@/components/voice/useNaturalVoice', () => ({
  useNaturalVoice: () => ({ play: vi.fn(), stop: vi.fn() }),
}));
vi.mock('@/lib/devstudio/ellie-unified-handlers', () => ({
  ELLIE_ROUTE_LABEL: {},
  fetchAiHealth: () => new Promise(() => {}),
  routeEllieMessage: vi.fn(),
  selectStudioAgent: vi.fn(),
  shouldOrchestrateMessage: vi.fn(),
  streamOrchestratedPlan: vi.fn(),
  streamPlatformChat: vi.fn(),
}));
beforeEach(() => {
  window.localStorage.clear();
  vi.clearAllMocks();
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: vi.fn(),
  });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it('discards saved vendor preferences and sends live questions to the owned provider', async () => {
  window.localStorage.setItem('elevate:studio:provider', 'openai');
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ conversation: { id: 'owned-conversation' } }),
    })
    .mockResolvedValueOnce({ ok: true, json: async () => ({}) });
  vi.stubGlobal('fetch', fetcher);

  render(<UnifiedEllieChat embedded restoreLatest={false} />);

  const provider = screen.getByRole('combobox', { name: 'Choose inference provider' });
  expect(within(provider).getAllByRole('option').map((option) => option.textContent)).toEqual([
    'Elevate-owned AI',
  ]);
  expect(provider).toBeDisabled();
  expect(window.localStorage.getItem('elevate:studio:provider')).toBeNull();

  fireEvent.change(screen.getByRole('textbox', { name: 'Tell Paris what you need done...' }), {
    target: { value: 'What is the current course catalog?' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Send request' }));

  await waitFor(() => expect(streamPlatformChat).toHaveBeenCalledTimes(1));
  expect(vi.mocked(streamPlatformChat).mock.calls[0]?.[1]).toMatchObject({
    agent: 'ADMIN_AI',
    conversationId: 'owned-conversation',
    provider: 'elevate',
  });
  expect(JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body))).toMatchObject({
    config: { agent: 'PARIS', surface: 'unified-studio' },
  });
});
it('never claims runtime connection before a probe and keeps the composer usable while health is pending', () => {
  render(<UnifiedEllieChat embedded restoreLatest={false} />);
  expect(screen.getByText('AI configuration: checking…')).toBeInTheDocument();
  expect(screen.queryByText(/runtime: connected/)).not.toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: 'Tell Paris what you need done...' })).toHaveClass(
    'text-xl',
    'leading-[1.5]',
  );
  fireEvent.change(screen.getByRole('textbox', { name: 'Tell Paris what you need done...' }), {
    target: { value: 'Inspect current jobs' },
  });
  expect(screen.getByRole('button', { name: 'Send request' })).toBeEnabled();
});
it('shows the exact restored approval checkpoint instead of losing it after a reload', () => {
  render(
    <UnifiedEllieChat
      embedded
      restoreLatest={false}
      restoredCheckpoint={{
        planId: 'plan-2',
        taskId: 'task-2',
        runId: 'run-2',
        title: 'Resume reviewed sample',
        status: 'awaiting_approval',
      }}
    />,
  );
  expect(screen.getByText('Approval needed: Resume reviewed sample')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Approve and continue this flow' })).toBeEnabled();
});

it('surfaces a failed restore and retries the same conversation without creating another', async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce({ ok: false })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        conversations: [
          { id: 'owned', messages: [{ role: 'assistant', content: 'Stored reviewed lesson' }] },
        ],
      }),
    });
  vi.stubGlobal('fetch', fetcher);
  render(<UnifiedEllieChat embedded restoreLatest={false} selectedConversationId="owned" />);
  expect(await screen.findByText('Could not restore this conversation.')).toBeInTheDocument();
  fireEvent.change(screen.getByRole('textbox', { name: 'Tell Paris what you need done...' }), {
    target: { value: 'Resume' },
  });
  expect(screen.getByRole('button', { name: 'Send request' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Retry conversation' }));
  expect(await screen.findByText('Stored reviewed lesson')).toBeInTheDocument();
  expect(fetcher.mock.calls.map(([url]) => url)).toEqual([
    '/api/admin/dev-studio/conversations?id=owned',
    '/api/admin/dev-studio/conversations?id=owned',
  ]);
});

it('exposes the real attachment input to the workspace upload control', () => {
  render(
    <>
      <label htmlFor="studio-files">Upload files</label>
      <UnifiedEllieChat embedded restoreLatest={false} attachmentInputId="studio-files" />
    </>,
  );
  expect(screen.getByLabelText('Upload files')).toHaveAttribute('type', 'file');
  expect(screen.getByRole('button', { name: 'Attach a file', exact: true })).not.toHaveClass('hidden');
});
