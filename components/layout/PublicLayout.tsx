// Server Component - NO 'use client'
// Layout for public marketing pages - renders header/footer server-side.
// Skips marketing chrome for authenticated app routes (/lms, /learner,
// /admin, /instructor, /employer, /partner, /staff-portal, /mentor).

import { Suspense } from 'react';
import { headers } from 'next/headers';
import Header from '@/components/site/Header';
import ServerFooter from '@/components/site/ServerFooter';
import ClientWidgets from './ClientWidgets';

// Routes that render their own shell — marketing header/footer must not appear.
const APP_ROUTE_PREFIXES = [
  '/lms',
  '/learner',
  '/admin',
  '/instructor',
  '/employer',
  '/partner',
  '/staff-portal',
  '/mentor',
  '/program-holder',
];

function isAppRoute(pathname: string): boolean {
  return APP_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  );
}

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default async function PublicLayout({ children }: PublicLayoutProps) {
  const headersList = await headers();
  // x-pathname is set by proxy.ts (middleware) on every request.
  const pathname = headersList.get('x-pathname') || '/';

  if (isAppRoute(pathname)) {
    // App routes manage their own layout — render children only.
    return <>{children}</>;
  }

  return (
    <>
      {/* Server-rendered header - always visible on public pages */}
      <Header />

      {/* Main content */}
      <Suspense>
        <main id="main-content" className="pt-[70px]" role="main" tabIndex={-1}>
          {children}
        </main>
      </Suspense>

      {/* Server-rendered footer - always visible on public pages */}
      <ServerFooter />

      {/* Client-only widgets (chat, analytics, etc.) */}
      <ClientWidgets />
    </>
  );
}
