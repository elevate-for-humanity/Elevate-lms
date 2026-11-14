import { LMS_HOST } from '@/lib/routing/portal-map';

/** Move legacy entry requests before setting host-only preview cookies. */
export function canonicalPreviewUrl(request: Request): URL | null {
  const current = new URL(request.url);
  const host = (request.headers.get('host') || current.host).split(':')[0].toLowerCase();
  const canonical = new URL(LMS_HOST);
  if (host !== 'app.elevateforhumanity.org' || canonical.hostname === host) return null;
  const destination = new URL(canonical.origin);
  destination.pathname = current.pathname;
  destination.search = current.search;
  return destination;
}
