import { expect, it } from 'vitest';
import policy from '@/config/google-runtime-policy.json';
import { GOOGLE_CALENDAR_RUNTIME_KEYS, isGoogleCalendarRuntimeKey, validateGoogleCalendarUpdates } from '@/lib/google/calendar-settings';
const pair = [{ key: 'GOOGLE_CALENDAR_CLIENT_ID', value: '484736877039-fixture.apps.googleusercontent.com' }, { key: 'GOOGLE_CALENDAR_CLIENT_SECRET', value: 'test-private-client-secret' }];
it('permits the same calendar keys on both owning runtimes', () => {
  for (const key of GOOGLE_CALENDAR_RUNTIME_KEYS) {
    expect(policy.components.admin.keys).toContain(key); expect(policy.components.lms.keys).toContain(key);
    expect(isGoogleCalendarRuntimeKey(key)).toBe(true);
  }
  expect(isGoogleCalendarRuntimeKey('GOOGLE_UNRELATED_SECRET')).toBe(false);
});
it('requires complete matching credential-pair updates', () => {
  expect(() => validateGoogleCalendarUpdates(pair)).not.toThrow();
  expect(() => validateGoogleCalendarUpdates([pair[0]])).toThrow('together');
  expect(() => validateGoogleCalendarUpdates([pair[1]])).toThrow('together');
});
it('rejects masked secrets and invalid OAuth IDs without echoing credentials', () => {
  expect(() => validateGoogleCalendarUpdates([pair[0], { ...pair[1], value: '••••••••' }])).toThrow('unmasked');
  expect(() => validateGoogleCalendarUpdates([{ ...pair[0], value: 'not-a-google-client' }, pair[1]])).toThrow('valid Google');
});
