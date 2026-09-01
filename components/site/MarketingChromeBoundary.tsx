import { headers } from 'next/headers';
import Header from '@/components/site/Header';
import { SiteFooter } from '@/components/site-footer';
import { ParisFloatingWrapper } from '@/components/paris/ParisFloatingWrapper';
import { RouteTransition } from '@/components/site/RouteTransition';

const OPERATIONAL_PREFIXES = ['/case-manager', '/workforce-board', '/provider'] as const;

function isOperationalPath(pathname: string) {
  const clean = pathname.split('?')[0] || '/';
  return OPERATIONAL_PREFIXES.some((prefix) => clean === prefix || clean.startsWith(`${prefix}/`));
}

/**
 * Marketing owns several authenticated workspaces for deployment reasons, but
 * those pages must render as operational software rather than as public-site
 * content. Middleware supplies x-pathname for every Marketing request.
 */
export async function MarketingChromeBoundary({ children }: { children: React.ReactNode }) {
  const requestHeaders = await headers();
  const pathname = requestHeaders.get('x-pathname') || '/';
  const operational = isOperationalPath(pathname);

  if (operational) {
    return <div id="main-content" tabIndex={-1} className="min-h-dvh focus:outline-none">{children}</div>;
  }

  return (
    <>
      <Header />
      <div id="main-content" tabIndex={-1} className="site-main focus:outline-none"><RouteTransition>{children}</RouteTransition></div>
      <SiteFooter />
      {!pathname.startsWith('/store') && <ParisFloatingWrapper surface="public" />}
    </>
  );
}
