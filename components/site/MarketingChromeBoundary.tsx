'use client';

import { usePathname } from 'next/navigation';
import { RouteTransition } from '@/components/site/RouteTransition';

const OPERATIONAL_PREFIXES = ['/case-manager', '/workforce-board', '/provider'] as const;
const STANDALONE_BRAND_PREFIXES = ['/meri-gold-round', '/merigoldround'] as const;

function matchesPrefix(pathname: string, prefixes: readonly string[]) {
  const clean = pathname.split('?')[0] || '/';
  return prefixes.some((prefix) => clean === prefix || clean.startsWith(`${prefix}/`));
}

/** Public reading styles must not leak into authenticated workspaces. */
export function MarketingChromeBoundary({ children, header, footer, paris }: {
  children: React.ReactNode;
  header: React.ReactNode;
  footer: React.ReactNode;
  paris: React.ReactNode;
}) {
  const pathname = usePathname() || '/';
  const operational = matchesPrefix(pathname, OPERATIONAL_PREFIXES);
  const standaloneBrand = matchesPrefix(pathname, STANDALONE_BRAND_PREFIXES);

  if (operational || standaloneBrand) {
    return <div id="main-content" tabIndex={-1} className="min-h-dvh focus:outline-none">{children}</div>;
  }

  return (
    <>
      {header}
      <div id="main-content" data-marketing-main tabIndex={-1} className="site-main focus:outline-none">
        <RouteTransition>{children}</RouteTransition>
      </div>
      {footer}
      {!pathname.startsWith('/store') ? paris : null}
    </>
  );
}
