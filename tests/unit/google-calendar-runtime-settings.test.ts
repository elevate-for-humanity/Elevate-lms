import { expect, it } from 'vitest';
import policy from '@/config/google-runtime-policy.json';
import { googleCalendarCredentials, GOOGLE_CALENDAR_RUNTIME_KEYS, isGoogleCalendarRuntimeKey, validateGoogleCalendarUpdates } from '@/lib/google/calendar-settings';
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

it('selects a complete preferred pair, otherwise a complete legacy pair', () => {
  const legacy = { GOOGLE_CLIENT_ID: 'legacy-id', GOOGLE_CLIENT_SECRET: 'legacy-secret' };
  expect(googleCalendarCredentials(legacy)).toEqual({ clientId: 'legacy-id', clientSecret: 'legacy-secret' });
  expect(googleCalendarCredentials({ ...legacy, GOOGLE_CALENDAR_CLIENT_ID: 'calendar-id', GOOGLE_CALENDAR_CLIENT_SECRET: 'calendar-secret' }))
    .toEqual({ clientId: 'calendar-id', clientSecret: 'calendar-secret' });
});
it.each([
  { GOOGLE_CALENDAR_CLIENT_ID: 'calendar-id', GOOGLE_CLIENT_SECRET: 'other-secret' },
  { GOOGLE_CALENDAR_CLIENT_SECRET: 'calendar-secret', GOOGLE_CLIENT_ID: 'other-id' },
  { GOOGLE_CALENDAR_CLIENT_ID: 'calendar-id', GOOGLE_CLIENT_ID: 'legacy-id', GOOGLE_CLIENT_SECRET: 'legacy-secret' },
  { GOOGLE_CALENDAR_CLIENT_SECRET: 'calendar-secret', GOOGLE_CLIENT_ID: 'legacy-id', GOOGLE_CLIENT_SECRET: 'legacy-secret' },
  { GOOGLE_CLIENT_ID: 'id', GOOGLE_CLIENT_SECRET: '   ' },
  {},
])('rejects missing and mixed credential pairs: %j', env => {
  expect(googleCalendarCredentials(env)).toBeNull();
});
