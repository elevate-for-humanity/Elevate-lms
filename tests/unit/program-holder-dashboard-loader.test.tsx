import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

const state = vi.hoisted(() => ({ load: vi.fn(), renderWorkspace: vi.fn() }));
vi.mock('@/lib/program-holder/workspace', () => ({ getProgramHolderWorkspace: state.load }));
vi.mock('@/components/program-holder/ProgramHolderWorkspaceView', () => ({
  ProgramHolderWorkspaceView: (props: any) => {
    state.renderWorkspace(props);
    return <h1>Verified holder workspace</h1>;
  },
}));
import Page from '@/apps/lms/app/program-holder/dashboard/page';

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

it('passes one verified workspace through to the dashboard without a second serial load', async () => {
  const workspace = { mode: 'holder', holder: { id: 'assigned-holder' }, enrollments: [{ id: 'assigned-student' }] };
  state.load.mockResolvedValue(workspace);
  render(await Page());
  expect(state.load).toHaveBeenCalledExactlyOnceWith();
  expect(state.renderWorkspace).toHaveBeenCalledExactlyOnceWith({ section: 'dashboard', workspace });
  expect(screen.getByRole('heading', { name: 'Verified holder workspace' })).toBeVisible();
});

it('does not render or accept an injected workspace when the loader denies access', async () => {
  state.load.mockRejectedValue(new Error('PROGRAM_HOLDER_LOOKUP_UNAVAILABLE'));
  await expect(Page()).rejects.toThrow('PROGRAM_HOLDER_LOOKUP_UNAVAILABLE');
  expect(state.renderWorkspace).not.toHaveBeenCalled();
});

it('keeps the unscoped administrator preview separate from holder records', async () => {
  state.load.mockResolvedValue({ mode: 'admin', holder: null, enrollments: [] });
  render(await Page());
  expect(screen.getByRole('heading', { name: 'Program Holder PWA' })).toBeVisible();
  expect(screen.getByRole('link', { name: 'Select a Program Holder in Admin' })).toHaveAttribute('href', 'https://admin.elevateforhumanity.org/program-holders');
  expect(state.renderWorkspace).not.toHaveBeenCalled();
});
