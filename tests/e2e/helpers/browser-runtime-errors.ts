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

/** WebKit reports canceled navigation fetches as page errors. Require the
 * corresponding canceled request; an actual CORS failure must still fail QA. */
export function isConfirmedWebKitCancellation(
  error: CapturedBrowserError,
  requests: CancelledBrowserRequest[],
  browserName: string,
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
  return requests.some(
    (request) =>
      request.url.replace(/^https?:\/\//, '') === fragment &&
      request.errorText === 'Load request cancelled' &&
      Math.abs(request.time - error.time) <= 250,
  );
}
