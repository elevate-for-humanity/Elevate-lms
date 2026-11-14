import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PwaInstallButton } from '@/components/pwa/PwaInstallButton';
import { PwaInstallBanner } from '@/components/pwa/PwaInstallBanner';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { capturePwaInstallPrompt, clearPwaInstallPrompt } from '@/lib/pwa/install-prompt';

function offerInstall(outcome: 'accepted' | 'dismissed' = 'dismissed', fail = false) {
  const prompt = fail ? vi.fn().mockRejectedValue(new Error('Prompt unavailable')) : vi.fn().mockResolvedValue(undefined);
  const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
    prompt,
    userChoice: Promise.resolve({ outcome }),
  });
  act(() => capturePwaInstallPrompt(event));
  return prompt;
}

beforeEach(() => {
  clearPwaInstallPrompt();
  window.localStorage.clear();
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 Chrome/132.0.0.0');
});
afterEach(() => {
  cleanup();
  clearPwaInstallPrompt();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Dashboard app installation', () => {
  it('keeps the action usable without a native prompt and explains desktop installation', () => {
    render(<PwaInstallButton />);
    const button = screen.getByRole('button', { name: 'Install App' });
    expect(button).toBeEnabled();
    fireEvent.click(button);
    expect(screen.getByRole('region', { name: 'App installation instructions' })).toHaveTextContent('Chrome address bar');
    expect(button).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Close instructions' }));
    expect(screen.queryByRole('region')).toBeNull();
  });

  it.each([
    ['iPhone', 'Mozilla/5.0 (iPhone) AppleWebKit Safari/604.1', 0],
    ['iPad with desktop user agent', 'Mozilla/5.0 (Macintosh) AppleWebKit Safari/605.1', 5],
  ])('provides Add to Home Screen instructions on %s', (_name, userAgent, touchPoints) => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(userAgent as string);
    Object.defineProperty(navigator, 'maxTouchPoints', { configurable: true, value: touchPoints });
    render(<PwaInstallButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Install App' }));
    expect(screen.getByRole('region')).toHaveTextContent('Add to Home Screen');
    expect(screen.getByRole('region')).not.toHaveTextContent('Add to Dock');
  });

  it('provides Android browser instructions without waiting for install eligibility', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 Android Chrome/132.0');
    render(<PwaInstallButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Install App' }));
    expect(screen.getByRole('region')).toHaveTextContent('Add to Home screen');
  });

  it('consumes a native prompt only once across mounted controls, including cancellation', async () => {
    const prompt = offerInstall();
    const first = renderHook(() => usePwaInstall());
    const second = renderHook(() => usePwaInstall());
    expect(first.result.current.canInstall).toBe(true);
    await act(async () => {
      expect(await Promise.all([first.result.current.promptInstall(), second.result.current.promptInstall()])).toEqual([false, false]);
    });
    expect(prompt).toHaveBeenCalledTimes(1);
    expect(first.result.current.canInstall).toBe(false);
    expect(second.result.current.canInstall).toBe(false);
  });

  it.each([false, true])('offers manual installation after a dismissed or failed prompt (failure: %s)', async (fail) => {
    const prompt = offerInstall('dismissed', fail);
    render(<PwaInstallButton />);
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Install App' })));
    expect(prompt).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('region')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Install App' })).toBeEnabled();
  });

  it('preserves manual installation after the optional banner is dismissed', async () => {
    vi.useFakeTimers();
    const prompt = offerInstall('accepted');
    render(<><PwaInstallBanner /><PwaInstallButton label="Install dashboard" /></>);
    act(() => vi.advanceTimersByTime(8000));
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss install prompt' }));
    expect(screen.queryByRole('complementary')).toBeNull();
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Install dashboard' })));
    expect(prompt).toHaveBeenCalledTimes(1);
    // Accepting a prompt alone is not proof the browser finished installation.
    expect(screen.queryByRole('button', { name: 'Installed' })).toBeNull();
    act(() => window.dispatchEvent(new Event('appinstalled')));
    expect(screen.getByRole('button', { name: 'Installed' })).toBeDisabled();
  });

  it('preserves opt-in native-prompt-only controls', () => {
    render(<PwaInstallButton showOnlyInstallable />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
