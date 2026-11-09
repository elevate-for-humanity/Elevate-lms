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
 * Decide whether a WebKit "due to access control checks" page error is a
 * spurious abort report rather than a real access-control failure.
 *
 * WebKit reports a `pageError` in this format when an in-flight fetch is
 * superseded or abandoned during navigation. Two independent forms of evidence
 * prove the resource actually loaded:
 *
 *  1. A paired `requestfailed` cancellation ("Load request cancelled").
 *  2. The exact URL completed with a 2xx response. A genuine CORS failure would
 *     stop the app's own authenticated reads, so a successful response for the
 *     same URL — scoped by the caller to the app's auth origin — shows the read
 *     worked and the page error is a WebKit artifact.
 *
 * Without either form of evidence the error stays a failure, so an actual CORS
 * or authorization regression is never hidden.
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
      normalize(request.url) === fragment && request.status >= 200 && request.status < 300,
  );
}

