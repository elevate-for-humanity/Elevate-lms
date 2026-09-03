/**
 * Failure injection for runtime verification.
 *
 * ONLY active when NODE_ENV !== 'production'.
 * Allows forced failure of any route by passing ?fail=true in the request URL.
 *
 * Usage in a route:
 *   import { checkFailureInjection } from '@/lib/api/failure-injection';
 *   checkFailureInjection(request); // throws if ?fail=true in non-production
 *
 * Usage in tests:
 *   curl -X POST "http://localhost:3000/api/enroll/cna?fail=true" ...
 */

/**
 * Throws an injected failure error. Use in routes whose own catch block
 * handles the error (i.e. the route is NOT wrapped by withApiAudit, or
 * withApiAudit re-throws to Next.js).
 */
export function checkFailureInjection(req: Request): void {
  if (process.env.NODE_ENV === 'production') return;

  const url = new URL(req.url);
  if (url.searchParams.get('fail') === 'true') {
    throw new Error('[INJECTED FAILURE] Simulated DB/handler failure for verification testing');
  }
}

/**
 * Returns a redirect response on injected failure instead of throwing.
 * Use in routes wrapped by withApiAudit where the wrapper catches throws
 * before the route's own catch block can redirect.
 *
 * Returns null if no injection is active.
 */
export function injectFailureRedirect(req: Request, redirectUrl: string): Response | null {
  if (process.env.NODE_ENV === 'production') return null;

  const url = new URL(req.url);
  if (url.searchParams.get('fail') === 'true') {
    return new Response(null, {
      status: 303,
      headers: { Location: redirectUrl },
    });
  }
  return null;
}
