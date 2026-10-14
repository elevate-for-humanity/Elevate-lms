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
it('uses device speech for a generic PARIS announcement and respects mute', async () => {
  const speak = vi.fn();
  vi.stubGlobal(
    'SpeechSynthesisUtterance',
    class {
      constructor(public text: string) {}
      volume = 1;
      rate = 1;
    },
  );
  vi.stubGlobal('speechSynthesis', { speak });
  await playAlert({ ...DEFAULT_PWA_ALERTS, sound: 'voice', volume: 0.7 }, 'email');
  expect(speak.mock.calls[0][0]).toMatchObject({
    text: 'Elevate, you have a new email.',
    volume: 0.7,
  });
  await playAlert({ ...DEFAULT_PWA_ALERTS, sound: 'silent' });
  await playAlert({ ...DEFAULT_PWA_ALERTS, sound: 'voice', volume: 0 });
  expect(speak).toHaveBeenCalledTimes(1);
});
