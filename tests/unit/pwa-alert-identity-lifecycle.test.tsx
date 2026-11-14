import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ getUser: vi.fn(), channel: vi.fn(), on: vi.fn(), subscribe: vi.fn(), removeChannel: vi.fn() }));
vi.mock('@/lib/supabase/client', () => ({ createClient: () => ({
  auth: { getUser: h.getUser },
  channel: h.channel,
  removeChannel: h.removeChannel,
}) }));
vi.mock('@/lib/notifications/alert-audio', () => ({ playAlert: vi.fn() }));
import { PwaAlertListener } from '@/components/notifications/PwaAlertListener';

beforeEach(() => {
  vi.clearAllMocks();
  const channel = { on: h.on, subscribe: h.subscribe };
  h.channel.mockReturnValue(channel);
  h.on.mockReturnValue(channel);
  h.subscribe.mockReturnValue(channel);
  h.getUser.mockResolvedValue({ data: { user: { id: 'verified-user' } }, error: null });
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it('reuses the parent verified identity without another auth request and scopes the subscription', async () => {
  const view = render(<PwaAlertListener authenticatedUserId="parent-user" />);
  await waitFor(() => expect(h.subscribe).toHaveBeenCalledOnce());
  expect(h.getUser).not.toHaveBeenCalled();
  expect(h.channel).toHaveBeenCalledWith('pwa-alerts:parent-user');
  expect(h.on).toHaveBeenCalledWith('postgres_changes', expect.objectContaining({ filter: 'user_id=eq.parent-user' }), expect.any(Function));
  view.unmount();
  const request = vi.mocked(fetch).mock.calls[0][1];
  // Preferences are authenticated same-origin reads. Preserve them through
  // client-side navigation so WebKit does not report an aborted request as
  // an access-control page error. No credentials or security checks change.
  expect(request).toMatchObject({ cache: 'no-store', keepalive: true });
  expect(request?.signal).toBeUndefined();
  expect(h.removeChannel).toHaveBeenCalledOnce();
});

it('does not subscribe or surface stale preferences after unmount while keeping the read alive', async () => {
  let finish!: (response: Response) => void;
  vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(resolve => { finish = resolve; })));
  const view = render(<PwaAlertListener authenticatedUserId="parent-user" />);
  await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
  view.unmount();
  const options = vi.mocked(fetch).mock.calls[0][1];
  expect(options).toMatchObject({ cache: 'no-store', keepalive: true });
  expect(options?.signal).toBeUndefined();
  await act(async () => finish(new Response(JSON.stringify({ settings: { enabled: false } }), { status: 200 })));
  expect(h.subscribe).not.toHaveBeenCalled();
  expect(h.removeChannel).not.toHaveBeenCalled();
});

it('verifies identity when mounted without an authenticated parent', async () => {
  render(<PwaAlertListener />);
  await waitFor(() => expect(h.channel).toHaveBeenCalledWith('pwa-alerts:verified-user'));
  expect(h.getUser).toHaveBeenCalledOnce();
});

it('reports an identity provider error without subscribing or an unhandled rejection', async () => {
  h.getUser.mockRejectedValue(new Error('Provider unavailable'));
  render(<PwaAlertListener />);
  expect(await screen.findByRole('status')).toHaveTextContent('temporarily unavailable');
  expect(h.subscribe).not.toHaveBeenCalled();
});

it('does not subscribe after a pending identity check finishes on an unmounted page', async () => {
  let finish!: (value: unknown) => void;
  h.getUser.mockReturnValue(new Promise(resolve => { finish = resolve; }));
  const view = render(<PwaAlertListener />);
  view.unmount();
  await act(async () => finish({ data: { user: { id: 'late-user' } }, error: null }));
  expect(h.channel).not.toHaveBeenCalled();
});
