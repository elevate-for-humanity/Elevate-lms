import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

const runtime = vi.hoisted(() => ({ loaded: vi.fn() }));
vi.mock('@/components/communications/PlatformVideoRoom', () => {
  runtime.loaded();
  return { PlatformVideoRoom: ({ tokenEndpoint }: { tokenEndpoint: string }) => <div data-testid="lazy-video-room">{tokenEndpoint}</div> };
});
import { DashboardVideoCalls } from '@/components/communications/DashboardVideoCalls';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it('does not load the conferencing module for idle dashboard chrome, then loads the scoped room on a confirmed call', async () => {
  const fetcher = vi.fn(async (_url: unknown, options?: RequestInit) => options?.method === 'POST'
    ? Response.json({roomId:'authorized-room',title:'Test call',state:'ringing'}, {status:201})
    : Response.json({calls:[]}));
  vi.stubGlobal('fetch', fetcher);
  render(<DashboardVideoCalls extension="102" />);
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
  expect(runtime.loaded).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', {name:'Video call extension'}));
  expect(await screen.findByTestId('lazy-video-room')).toHaveTextContent('/api/communications/video-calls/authorized-room/token');
  expect(runtime.loaded).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button', {name:'End video call'})).toBeEnabled();
});
