export interface CapturedBrowserError {
  message: string;
  stack?: string;
  time: number;
}

export interface CancelledBrowserRequest {
  url: string;
  errorText: string;
  time: number;
}

/** A request that reached the server and returned a success status. */
export interface CompletedBrowserRequest {
  url: string;
  status: number;
  time: number;
}

/**
 * Track only the small set of authenticated GETs involved in navigation:
 * Supabase account/notification reads and the app notification-preferences API.
 * A successful unrelated request must never hide a genuine access failure.
 */
export function isTrackedClientRead(
  requestUrl: string,
  method: string,
  authOrigin: string,
  appOrigin: string,
): boolean {
  if (method !== 'GET') return false;
  let url: URL;
  try { url = new URL(requestUrl); } catch { return false; }
  return (url.origin === authOrigin &&
      (url.pathname === '/auth/v1/user' || url.pathname === '/rest/v1/notifications')) ||
    (url.origin === appOrigin && url.pathname === '/api/notifications/preferences');
}

/**
 * Reads that settle once and can be waited on before leaving a document.
 * Excludes recurring pollers (e.g. /api/notifications/preferences, refreshed on
 * a timer and on window focus) which never stop and would deadlock a wait.
 */
export function isSettlingClientRead(
  requestUrl: string,
  method: string,
  authOrigin: string,
  appOrigin: string,
): boolean {
  if (!isTrackedClientRead(requestUrl, method, authOrigin, appOrigin)) return false;
  try {
    return new URL(requestUrl).origin === authOrigin;
  } catch {
    return false;
  }
}

/**
 * Decide whether a WebKit "due to access control checks" page error is a
 * spurious abort report rather than a real access-control failure.
 *
 * WebKit reports a `pageError` in this format when an in-flight fetch is
 * superseded or abandoned during navigation. Require independent evidence
 * of a harmless abort instead of trusting the hostname. Even a same-origin
 * request can fail due to redirects, response policy or transport errors:
 *
 *  1. A paired `requestfailed` cancellation ("Load request cancelled").
 *  2. The exact URL completed with a 2xx response, scoped by the caller to the
 *     tracked read endpoints.
 *
 * Without any of this evidence the error stays a failure, so an actual CORS or
 * authorization regression is never hidden.
 */
export function isConfirmedWebKitCancellation(
  error: CapturedBrowserError,
  requests: CancelledBrowserRequest[],
  browserName: string,
  completedRequests: CompletedBrowserRequest[] = [],
): boolean {
  if (browserName !== 'webkit') return false;
  // WebKit puts the offending URL in the page error message (the stack is often
  // empty), and the URL may appear with or without a scheme. Read both fields
  // and normalize to host+path so either form matches the cancelled request.
  const text = `${error.message ?? ''}\n${error.stack ?? ''}`;
  if (!/due to access control checks\./.test(text)) return false;
  const fragment = text.match(
    /(?:https?:\/\/|\/\/|\/)([a-z0-9.-]+\.[a-z]{2,}\/\S+?)\s+due to access control checks\./i,
  )?.[1];
  if (!fragment) return false;
  const normalize = (value: string) => value.replace(/^https?:\/\//, '');
  const cancelled = requests.some(
    (request) =>
      normalize(request.url) === fragment &&
      request.errorText === 'Load request cancelled' &&
      Math.abs(request.time - error.time) <= 250,
  );
  if (cancelled) return true;
  return completedRequests.some(
    (request) =>
      normalize(request.url) === fragment && request.status >= 200 && request.status < 300 &&
      Math.abs(request.time - error.time) <= 3000,
  );
}

function hostOf(origin: string): string {
  try {
    return new URL(origin).host.toLowerCase();
  } catch {
    return '';
  }
}


