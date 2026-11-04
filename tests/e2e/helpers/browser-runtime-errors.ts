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
  const url = error.stack?.match(
    /^Fetch API cannot load (https?:\/\/\S+) due to access control checks\.$/m,
  )?.[1];
  if (!url) return false;
  return requests.some(
    (request) =>
      request.url === url &&
      request.errorText === 'Load request cancelled' &&
      Math.abs(request.time - error.time) <= 250,
  );
}
