import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ props: null as any }));
vi.mock('@livekit/components-react', () => ({
  LiveKitRoom: (props: any) => { mocks.props = props; return <div>{props.children}</div>; },
  VideoConference: () => <div>Video controls</div>, RoomAudioRenderer: () => null,
  StartAudio: () => null, useConnectionState: () => 'connected',
}));
vi.mock('@/components/communications/MeetingScreenShare', () => ({ MeetingScreenShare: ({ allowed }: any) => <button disabled={!allowed}>Share screen</button> }));
import { PlatformVideoRoom } from '@/components/communications/PlatformVideoRoom';
afterEach(() => { cleanup(); vi.unstubAllGlobals(); mocks.props = null; });

it('joins only after a user action and does not require camera or microphone to connect', async () => {
  const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ token: 'scoped-token', serverUrl: 'wss://video.example.test', canShare: false }) });
  vi.stubGlobal('fetch', fetcher);
  render(<PlatformVideoRoom tokenEndpoint="/api/meetings/assigned/token" />);
  expect(fetcher).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Join meeting' }));
  await screen.findByText('Video controls');
  expect(mocks.props).toMatchObject({ audio: false, video: false, connect: true });
  expect((screen.getByRole('button', { name: 'Share screen' }) as HTMLButtonElement).disabled).toBe(true);
  expect(screen.getByText('Meeting connection: connected')).toBeTruthy();
});

it('shows token failures and retries the authorized endpoint', async () => {
  const fetcher = vi.fn().mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Meeting is unavailable.' }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ token: 'new-token', serverUrl: 'wss://video.example.test' }) });
  vi.stubGlobal('fetch', fetcher);
  render(<PlatformVideoRoom tokenEndpoint="/api/meetings/assigned/token" />);
  fireEvent.click(screen.getByRole('button', { name: 'Join meeting' }));
  await screen.findByRole('alert');
  fireEvent.click(screen.getByRole('button', { name: 'Retry meeting connection' }));
  await screen.findByText('Video controls');
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
});

it('keeps missing devices separate from connection failure and allows leaving without reconnecting', async () => {
  const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ token: 'token', serverUrl: 'wss://video.example.test' }) });
  vi.stubGlobal('fetch', fetcher);
  render(<PlatformVideoRoom tokenEndpoint="/api/meetings/assigned/token" />);
  fireEvent.click(screen.getByRole('button', { name: 'Join meeting' }));
  await screen.findByText('Video controls');
  act(() => mocks.props.onMediaDeviceFailure('NotFound'));
  expect(screen.getByRole('alert').textContent).toContain('No camera or microphone was found');
  expect(screen.getByText('Video controls')).toBeTruthy();
  act(() => mocks.props.onDisconnected());
  expect(screen.getByRole('button', { name: 'Join meeting' })).toBeTruthy();
  expect(fetcher).toHaveBeenCalledTimes(1);
});

it('reports provider connection errors instead of leaving a frozen room', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ token: 'token', serverUrl: 'wss://video.example.test' }) }));
  render(<PlatformVideoRoom tokenEndpoint="/api/meetings/assigned/token" />);
  fireEvent.click(screen.getByRole('button', { name: 'Join meeting' }));
  await screen.findByText('Video controls');
  act(() => mocks.props.onError(new Error('Video service could not connect')));
  expect(screen.getByRole('alert').textContent).toContain('Video service could not connect');
  expect(screen.getByRole('button', { name: 'Retry meeting connection' })).toBeTruthy();
});
