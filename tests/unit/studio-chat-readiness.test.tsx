import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import UnifiedEllieChat from '@/components/studio/UnifiedEllieChat';

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
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: vi.fn(),
  });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
it('never claims runtime connection before a probe and keeps the composer usable while health is pending', () => {
  render(<UnifiedEllieChat embedded restoreLatest={false} />);
  expect(screen.getByText('AI configuration: checking…')).toBeInTheDocument();
  expect(screen.queryByText(/runtime: connected/)).not.toBeInTheDocument();
  fireEvent.change(screen.getByRole('textbox', { name: 'Tell Admin AI what you need done...' }), {
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
  fireEvent.change(screen.getByRole('textbox', { name: 'Tell Admin AI what you need done...' }), {
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
