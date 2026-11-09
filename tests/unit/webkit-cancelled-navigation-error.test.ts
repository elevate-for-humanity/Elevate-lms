import { expect, it } from 'vitest';
import { isConfirmedWebKitCancellation } from '../e2e/helpers/browser-runtime-errors';
const url = 'https://lms.elevateforhumanity.org/api/health/build-version';
const error = { message: '/lms.elevateforhumanity.org/api/health/build-version due to access control checks.', stack: `Fetch API cannot load ${url} due to access control checks.\n at navigation`, time: 1000 };
const cancelled = { url, errorText: 'Load request cancelled', time: 1001 };
it('recognizes a WebKit error backed by the exact canceled request', () => {
  expect(isConfirmedWebKitCancellation(error, [cancelled], 'webkit')).toBe(true);
});
it('recognizes the production WebKit format (scheme-less URL in message, empty stack)', () => {
  // Reproduced from employer-onboarding on iPhone WebKit: the page error carries
  // the URL in message without a scheme and the stack is empty.
  const production = {
    message: '/lms.elevateforhumanity.org/api/notifications/preferences due to access control checks.',
    stack: '',
    time: 1000,
  };
  const pref = {
    url: 'https://lms.elevateforhumanity.org/api/notifications/preferences',
    errorText: 'Load request cancelled',
    time: 1001,
  };
  expect(isConfirmedWebKitCancellation(production, [pref], 'webkit')).toBe(true);
  // Still a failure when the same message has no paired cancellation.
  expect(isConfirmedWebKitCancellation(production, [], 'webkit')).toBe(false);
});
it('keeps CORS failures without cancellation evidence as failures', () => {
  expect(isConfirmedWebKitCancellation(error, [], 'webkit')).toBe(false);
  expect(isConfirmedWebKitCancellation(error, [{ ...cancelled, errorText: 'Access control check failed' }], 'webkit')).toBe(false);
});
it('keeps unrelated requests and stale cancellation evidence as failures', () => {
  expect(isConfirmedWebKitCancellation(error, [{ ...cancelled, url: url + '/other' }], 'webkit')).toBe(false);
  expect(isConfirmedWebKitCancellation(error, [{ ...cancelled, time: 1500 }], 'webkit')).toBe(false);
});
it('never hides JavaScript exceptions or errors from other browsers', () => {
  const jsError = { message: 'TypeError: undefined is not an object', stack: 'TypeError: undefined is not an object\n at page', time: 1000 };
  expect(isConfirmedWebKitCancellation(jsError, [cancelled], 'webkit')).toBe(false);
  expect(isConfirmedWebKitCancellation(error, [cancelled], 'chromium')).toBe(false);
});

// Reproduced from the employer-onboarding iPhone-WebKit run: WebKit reported
// "/cuxzzpsyufcewtmicszk.supabase.co/auth/v1/user due to access control checks."
// three times, but the trace showed 19 identical requests all returning HTTP
// 200 and zero cancelled requests. The page error is a spurious abort report.
it('recognizes a WebKit abort report when the same URL completed successfully', () => {
  const authError = {
    message: '/cuxzzpsyufcewtmicszk.supabase.co/auth/v1/user due to access control checks.',
    stack: 'Fetch API cannot load https://cuxzzpsyufcewtmicszk.supabase.co/auth/v1/user due to access control checks.',
    time: 1000,
  };
  const completed = {
    url: 'https://cuxzzpsyufcewtmicszk.supabase.co/auth/v1/user',
    status: 200,
    time: 900,
  };
  expect(isConfirmedWebKitCancellation(authError, [], 'webkit', [completed])).toBe(true);
});
it('still fails when the same URL never returned a success status', () => {
  const authError = {
    message: '/cuxzzpsyufcewtmicszk.supabase.co/auth/v1/user due to access control checks.',
    stack: '',
    time: 1000,
  };
  // A 4xx/5xx response is not proof the app's read worked.
  expect(isConfirmedWebKitCancellation(authError, [], 'webkit', [
    { url: 'https://cuxzzpsyufcewtmicszk.supabase.co/auth/v1/user', status: 403, time: 900 },
  ])).toBe(false);
  // A successful response for a different path proves nothing about this URL.
  expect(isConfirmedWebKitCancellation(authError, [], 'webkit', [
    { url: 'https://cuxzzpsyufcewtmicszk.supabase.co/auth/v1/other', status: 200, time: 900 },
  ])).toBe(false);
  // No evidence at all remains a failure.
  expect(isConfirmedWebKitCancellation(authError, [], 'webkit', [])).toBe(false);
});
it('does not use completed-request evidence for non-WebKit browsers', () => {
  const authError = {
    message: '/cuxzzpsyufcewtmicszk.supabase.co/auth/v1/user due to access control checks.',
    stack: '',
    time: 1000,
  };
  const completed = { url: 'https://cuxzzpsyufcewtmicszk.supabase.co/auth/v1/user', status: 200, time: 900 };
  expect(isConfirmedWebKitCancellation(authError, [], 'chromium', [completed])).toBe(false);
});

