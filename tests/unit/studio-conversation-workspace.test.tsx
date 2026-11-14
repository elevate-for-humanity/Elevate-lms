import React, { useEffect } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import StudioCommandWorkspace from '@/components/studio/StudioCommandWorkspace';

// This workspace test has no signed-in notification account. Keep the real
// notification component mounted without depending on a live database client.
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ auth: {
    getUser: async () => ({ data: { user: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
  } }),
}));

vi.mock('next/dynamic', () => ({
  default: (loader: () => unknown) =>
    String(loader).includes('CloudBrowserWorkspace')
      ? () => <div data-testid="studio-browser-panel">Existing browser workspace</div>
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
  it('keeps phone navigation above the active tool and exposes every registered workspace through search', async () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ conversations: [], tasks: [], checks: [] }) })));
    render(<StudioCommandWorkspace workspaces={[
      { id: 'browser', label: 'Cloud Browser', route: '/studio/browser' },
      { id: 'repository', label: 'Repository Workspace', route: '/studio/repository' },
      { id: 'memory', label: 'AI Memory', route: '/studio/memory' },
    ]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Work', exact: true }));
    expect(screen.getByRole('button', { name: 'Tools', exact: true })).toBeVisible();
    expect(screen.getByRole('region', { name: 'Elevate Studio conversation', hidden: true })).not.toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Tools', exact: true }));
    fireEvent.change(screen.getByRole('searchbox', { name: 'Find a Studio tool' }), { target: { value: 'Memory' } });
    expect(screen.getByRole('button', { name: 'AI Memory' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'AI Memory' }));
    expect(screen.getByRole('region', { name: 'Active Studio tool' })).toBeVisible();
    fireEvent.click(screen.getAllByRole('button', { name: 'Chat', exact: true })[0]);
    expect(screen.getByRole('region', { name: 'Elevate Studio conversation' })).toBeVisible();
  });
  it('keeps a single readable pane on a phone and prevents overlapping split view', async () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ conversations: [], tasks: [], checks: [] }) })));
    render(<StudioCommandWorkspace workspaces={[]} />);
    expect(screen.getByRole('button', { name: 'Split screen', exact: true })).toBeDisabled();
    expect(screen.getByRole('region', { name: 'Elevate Studio conversation' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Work', exact: true }));
    expect(screen.getByRole('region', { name: 'Active Studio tool' })).toBeVisible();
    expect(screen.getByRole('region', { name: 'Elevate Studio conversation', hidden: true })).not.toBeVisible();
    fireEvent.click(screen.getAllByRole('button', { name: 'Chat', exact: true })[0]);
    expect(screen.getByRole('region', { name: 'Elevate Studio conversation' })).toBeVisible();
  });
  it('offers a side-by-side conversation and tool pane on wide displays', async () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ conversations: [], tasks: [], checks: [] }) })));
    render(<StudioCommandWorkspace workspaces={[]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Split screen', exact: true }));
    expect(screen.getByRole('button', { name: 'Split screen', exact: true })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('region', { name: 'Elevate Studio conversation' })).toBeVisible();
    expect(screen.getByRole('region', { name: 'Active Studio tool' })).toBeVisible();
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
    expect(
      screen.getByRole('navigation', { name: 'Studio environments and tools' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Environment variables' })).toHaveAttribute(
      'href',
      '/integrations/env-manager',
    );
    expect(screen.getByText('Upload files', { selector: 'label' })).toHaveAttribute('for');
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
