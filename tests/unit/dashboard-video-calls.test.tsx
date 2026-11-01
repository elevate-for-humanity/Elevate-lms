import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/components/communications/PlatformVideoRoom', () => ({ PlatformVideoRoom: ({ tokenEndpoint }: { tokenEndpoint: string }) => <div data-testid="video-room">{tokenEndpoint}</div> }));
import { DashboardVideoCalls } from '@/components/communications/DashboardVideoCalls';
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const call = { roomId: 'room', title: 'Caller → Recipient', direction: 'incoming', state: 'ringing' };
describe('dashboard video call controls', () => {
  it('uses the entered extension and closes only after end is confirmed', async () => {
    const fetcher = vi.fn(async (_url: unknown, options?: RequestInit) => {
      if (options?.method === 'POST') return Response.json({ ...call, direction: 'outgoing' }, { status: 201 });
      if (options?.method === 'PATCH') return Response.json({ ok: true });
      return Response.json({ calls: [] });
    }); vi.stubGlobal('fetch', fetcher);
    render(<DashboardVideoCalls extension="102" />);
    fireEvent.click(screen.getByRole('button', { name: 'Video call extension' }));
    await screen.findByTestId('video-room');
    expect(fetcher).toHaveBeenCalledWith('/api/communications/video-calls', expect.objectContaining({ method: 'POST', body: JSON.stringify({ extension: '102' }) }));
    fireEvent.click(screen.getByRole('button', { name: 'End video call' }));
    await waitFor(() => expect(screen.queryByTestId('video-room')).toBeNull());
    expect(fetcher).toHaveBeenCalledWith('/api/communications/video-calls', expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ roomId: 'room', action: 'end' }) }));
  });
  it('requires the answer action before opening an incoming video room', async () => {
    const fetcher = vi.fn(async (_url: unknown, options?: RequestInit) => options?.method === 'PATCH' ? Response.json({ ok: true }) : Response.json({ calls: [call] }));
    vi.stubGlobal('fetch', fetcher); render(<DashboardVideoCalls />);
    await screen.findByRole('dialog', { name: 'Incoming video call' }); expect(screen.queryByTestId('video-room')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Answer video call' }));
    await screen.findByTestId('video-room'); expect(fetcher).toHaveBeenCalledWith('/api/communications/video-calls', expect.objectContaining({ body: JSON.stringify({ roomId: 'room', action: 'accept' }) }));
  });
  it('declines without joining a video room', async () => {
    const fetcher = vi.fn(async (_url: unknown, options?: RequestInit) => options?.method === 'PATCH' ? Response.json({ ok: true }) : Response.json({ calls: [call] }));
    vi.stubGlobal('fetch', fetcher); render(<DashboardVideoCalls />);
    fireEvent.click(await screen.findByRole('button', { name: 'Decline video call' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull()); expect(screen.queryByTestId('video-room')).toBeNull();
  });
  it('shows provider failure without reporting a connected call', async () => {
    vi.stubGlobal('fetch', vi.fn(async (_url: unknown, options?: RequestInit) => options?.method === 'POST' ? Response.json({ error: 'Provider unavailable' }, { status: 503 }) : Response.json({ calls: [] })));
    render(<DashboardVideoCalls extension="102" />); fireEvent.click(screen.getByRole('button', { name: 'Video call extension' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Provider unavailable'); expect(screen.queryByTestId('video-room')).toBeNull();
  });
});
