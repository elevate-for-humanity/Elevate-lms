import React, { useEffect } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import StudioCommandWorkspace from '@/components/studio/StudioCommandWorkspace';

vi.mock('next/dynamic', () => ({ default: () => () => <div>Existing tool workspace</div> }));
vi.mock('@/components/studio/RepositoryLivePreview', () => ({
  default: () => <div>Existing preview</div>,
}));
vi.mock('@/components/studio/UnifiedEllieChat', () => ({
  default: (props: {
    selectedConversationId?: string;
    onConversationChange: (id: string) => void;
    restoredCheckpoint?: { status: string; planId: string };
  }) => {
    useEffect(
      () => props.onConversationChange(props.selectedConversationId || 'first'),
      [props.selectedConversationId, props.onConversationChange],
    );
    return (
      <div>
        <p>Conversation {props.selectedConversationId || 'first'}</p>
        {props.restoredCheckpoint ? (
          <p>
            {props.restoredCheckpoint.planId}: {props.restoredCheckpoint.status}
          </p>
        ) : null}
      </div>
    );
  },
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
describe('One Studio conversation workspace', () => {
  it('mounts existing tools, opens an owned saved conversation, and restores its exact checkpoint', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => ({
        ok: true,
        json: async () =>
          url.includes('conversations?summary=1')
            ? { conversations: [{ id: 'second', title: 'Reviewed course sample' }] }
            : url.includes('tasks?conversationId=second')
              ? {
                  tasks: [
                    {
                      id: 'task-2',
                      trace_id: 'plan-2:s1',
                      status: 'awaiting_approval',
                      studio_run_id: 'run-2',
                    },
                  ],
                }
              : url.includes('plugins')
                ? { status: 'healthy', checks: [] }
                : { tasks: [], agents: [] },
      })),
    );
    render(
      <StudioCommandWorkspace
        workspaces={[
          { id: 'workflows', label: 'Workflow Designer', route: '/studio?workspace=workflows' },
        ]}
      />,
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Reviewed course sample' }));
    await waitFor(() => expect(screen.getByText('Conversation second')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('plan-2: awaiting_approval')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('link', { name: 'Workflow Designer' }));
    expect(screen.getByRole('region', { name: 'Active Studio tool' })).toBeInTheDocument();
  });
});
