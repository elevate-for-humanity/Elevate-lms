// Native fetch Response bodies avoid mixing Node 22 fetch with jsdom Blob implementations.
import { expect, it, vi, afterEach } from 'vitest';
import {
  normalizeAlertSettings,
  alertKind,
  ALERT_PHRASES,
  DEFAULT_PWA_ALERTS,
} from '@/lib/notifications/pwa-alert-settings';
import { playAlert } from '@/lib/notifications/alert-audio';
afterEach(() => vi.unstubAllGlobals());
it('validates sound choices, booleans and safe activity thresholds', () => {
  expect(
    normalizeAlertSettings({ enabled: 'yes', sound: 'unknown', volume: 5, inactive_days: 2 }),
  ).toMatchObject({ enabled: false, sound: 'chime', volume: 1, inactive_days: 14 });
  expect(normalizeAlertSettings({ sound: 'voice', enabled: true, volume: 0 })).toMatchObject({
    sound: 'voice',
    enabled: true,
    volume: 0,
  });
});
it('announces recorded activity and inbox events, not arbitrary notification text', () => {
  expect(alertKind({ idempotency_key: 'email:abc' })).toBe('email');
  expect(alertKind({ metadata: { alert_kind: 'sign_out' } })).toBe('sign_out');
  expect(alertKind({ title: 'random user content' })).toBeNull();
  expect(Object.values(ALERT_PHRASES).join(' ')).not.toMatch(/student name|email subject/);
});
it('plays natural voice for generic alerts without bypassing mute', async () => {
  const played = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('audio', { headers: { 'Content-Type': 'audio/mpeg' } })));
  vi.stubGlobal('Audio', class {
    preload = '';
    playbackRate = 1;
    volume = 1;
    addEventListener = vi.fn();
    play = played;
  });
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:alert');
  await playAlert({ ...DEFAULT_PWA_ALERTS, sound: 'voice', volume: 0.7 }, 'email');
  expect(played).toHaveBeenCalledTimes(1);
  await playAlert({ ...DEFAULT_PWA_ALERTS, sound: 'silent' });
  await playAlert({ ...DEFAULT_PWA_ALERTS, sound: 'voice', volume: 0 });
  expect(played).toHaveBeenCalledTimes(1);
});
