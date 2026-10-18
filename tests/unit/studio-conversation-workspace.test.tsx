import React, { useEffect } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import StudioCommandWorkspace from '@/components/studio/StudioCommandWorkspace';

vi.mock('next/dynamic', () => ({
  default: (loader: () => unknown) =>
    String(loader).includes('CloudBrowserWorkspace')
      ? (props: { autoRunTask?: boolean }) => (
          <div data-testid="studio-browser-panel" data-auto-run={String(props.autoRunTask)}>
            Existing browser workspace
          </div>
        )
      : String(loader).includes('RepositoryStudioWorkspace')
        ? (props: { initialMode?: string }) => (
            <div data-testid="studio-environment" data-mode={props.initialMode}>
              Existing execution environment
            </div>
          )
        : () => <div>Existing tool workspace</div>,
}));
vi.mock('@/components/studio/RepositoryLivePreview', () => ({
  default: () => <div>Existing preview</div>,
}));
vi.mock('@/components/studio/UnifiedEllieChat', () => ({
  default: (props: {
    selectedConversationId?: string;
    onConversationChange: (id: string) => void;
    restoredCheckpoint?: { status: string; planId: string };
    onCommandStart?: (command: string) => void;
  }) => {
    useEffect(
      () => props.onConversationChange(props.selectedConversationId || 'first'),
      [props.selectedConversationId, props.onConversationChange],
    );
    return (
      <div>
        <button
          onClick={() => props.onCommandStart?.('Inspect https://www.elevateforhumanity.org')}
        >
          Inspect site
        </button>
        <button onClick={() => props.onCommandStart?.('Resume the existing course build')}>
          Resume course
        </button>
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
  it('opens the browser for a browser command and preserves it for a follow-up', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => ({ conversations: [], tasks: [] }) })),
    );
    render(<StudioCommandWorkspace workspaces={[]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Inspect site' }));
    expect(screen.getByRole('region', { name: 'Active Studio tool' })).toBeVisible();
    expect(screen.getByTestId('studio-browser-panel')).toBeVisible();
    expect(screen.getByTestId('studio-browser-panel')).toHaveAttribute('data-auto-run', 'false');
    fireEvent.click(screen.getByRole('button', { name: 'Resume course' }));
    expect(screen.getByTestId('studio-browser-panel')).toBeVisible();
  });

  it('exposes the existing execution environment without navigating away from chat', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => ({ conversations: [], tasks: [] }) })),
    );
    render(
      <StudioCommandWorkspace
        workspaces={[
          { id: 'repository', label: 'Repository Workspace', route: '/studio/repository' },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Open execution environment' }));
    expect(screen.getByRole('region', { name: 'Active Studio tool' })).toBeVisible();
    expect(screen.getByRole('region', { name: 'Elevate Studio conversation' })).toBeInTheDocument();
    expect(screen.queryByText('Existing preview')).toBeNull();
    expect(screen.getByTestId('studio-environment')).toHaveAttribute('data-mode', 'runtime');
  });
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
    expect(screen.queryByTestId('studio-browser-panel')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Work', exact: true }));
    expect(screen.getAllByTestId('studio-browser-panel')).toHaveLength(1);
    fireEvent.click(screen.getAllByRole('button', { name: 'Chat', exact: true })[0]);
    expect(screen.getAllByTestId('studio-browser-panel')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Open Studio sidebar' }));
    expect(screen.queryByRole('button', { name: /PARIS|ELLIE|ZORA/ })).toBeNull();
    fireEvent.click(await screen.findByRole('button', { name: 'Reviewed course sample' }));
    await waitFor(() => expect(screen.getByText('Conversation second')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('plan-2: awaiting_approval')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('link', { name: 'Workflow Designer' }));
    expect(screen.getByRole('region', { name: 'Active Studio tool' })).toBeInTheDocument();
  });
});
