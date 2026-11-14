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

export const STUDENT_SUPPORT_TOPICS = ['academic', 'financial-aid', 'career', 'counseling', 'accessibility', 'scheduling'];
export function studentSupportTopicHref(topic) {
  return STUDENT_SUPPORT_TOPICS.includes(topic) ? `/student-support#${topic}` : null;
}

const PUBLIC_PAGE_REDIRECTS = {
  '/programs/skilled-trades': '/programs',
  '/programs/technology': '/programs',
  '/founder': '/about/elizabeth-greene',
  '/team': '/about/team',
  '/about/mission': '/about#mission',
  '/about/mission/mission': '/about#mission',
  '/about/partners': '/partners',
  '/about/partners/partners': '/partners',
  '/about/team/team': '/about/team',
  '/about/team/elizabeth-greene': '/about/elizabeth-greene',
};
/** Resolve retired public pages before React begins streaming a 200 response. */
export function resolvePublicPageRedirect({ host, pathname, search, method, marketingHost }) {
  if (!['GET', 'HEAD'].includes(method)) return null;
  if (!['www.elevateforhumanity.org', 'elevateforhumanity.org'].includes(host) && !host.endsWith('.run.app')) return null;
  const path = pathname.replace(/\/$/, '');
  const topic = path.match(/^\/student-support\/([^/]+)$/)?.[1];
  const target = PUBLIC_PAGE_REDIRECTS[path] || studentSupportTopicHref(topic || '');
  if (!target) return null;
  const destination = new URL(target, marketingHost);
  destination.search = search;
  return destination;
}
