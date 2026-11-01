/**
 * Exact public entry aliases, resolved before generic portal-prefix routing.
 * Deep links and mutation requests keep their existing owners and auth gates.
 * @param {{host: string, pathname: string, search: string, method: string, marketingHost: string, lmsHost: string}} request
 * @returns {URL | null}
 */
export function resolvePublicEntryAlias(request) {
  const { host, pathname, search, method, marketingHost, lmsHost } = request;
  if (method !== 'GET' && method !== 'HEAD') return null;
  if (host !== 'www.elevateforhumanity.org' && host !== 'elevateforhumanity.org' && !host.endsWith('.run.app')) return null;

  const path = pathname.replace(/\/$/, '');
  let destination;
  if (path === '/employer') destination = new URL('/employers', marketingHost);
  else if (path === '/testing-center') destination = new URL('/testing', marketingHost);
  else if (path === '/learner/dashboard') destination = new URL('/lms/dashboard', lmsHost);
  else return null;

  destination.search = search;
  return destination;
}
