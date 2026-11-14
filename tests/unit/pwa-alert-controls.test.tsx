import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PwaAlertSettings } from '@/components/notifications/PwaAlertSettings';
import { DEFAULT_PWA_ALERTS } from '@/lib/notifications/pwa-alert-settings';
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
it('saves the chosen PARIS sound and volume, and surfaces a failed save without claiming success', async () => {
  const fetcher = vi.fn(
    async (_url: string, options?: RequestInit) =>
      new Response(
        JSON.stringify(
          options?.method === 'PUT'
            ? { error: 'Settings service unavailable' }
            : { settings: DEFAULT_PWA_ALERTS, publicKey: '', pushConfigured: false, isAdmin: true },
        ),
        { status: options?.method === 'PUT' ? 503 : 200 },
      ),
  );
  vi.stubGlobal('fetch', fetcher);
  render(<PwaAlertSettings />);
  await waitFor(() =>
    expect(
      (screen.getByRole('button', { name: 'Save alert settings' }) as HTMLButtonElement).disabled,
    ).toBe(false),
  );
  fireEvent.change(screen.getByLabelText('Alert sound'), { target: { value: 'voice' } });
  fireEvent.change(screen.getByLabelText('Alert volume'), { target: { value: '0.8' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save alert settings' }));
  await screen.findByText('Settings service unavailable');
  expect(JSON.parse(String(fetcher.mock.calls[1][1]?.body))).toMatchObject({
    sound: 'voice',
    volume: 0.8,
  });
  expect(screen.queryByText('Alert settings saved.')).toBeNull();
});
