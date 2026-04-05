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

function extractPathname(value: string): string {
  try {
    if (value.startsWith('http')) return new URL(value).pathname;
    if (value.startsWith('/')) return value.split('?')[0];
  } catch { /* ignore */ }
  return '';
}

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default async function PublicLayout({ children }: PublicLayoutProps) {
  const headersList = await headers();

  const raw =
    headersList.get('x-pathname') ||
    headersList.get('x-invoke-path') ||
    headersList.get('x-forwarded-uri') ||
    headersList.get('x-url') ||
    '/';

  const pathname = extractPathname(raw);

  if (isAppRoute(pathname)) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <Suspense>
        <main id="main-content" className="pt-[70px] overflow-x-hidden" role="main" tabIndex={-1}>
          {children}
        </main>
      </Suspense>
      <ServerFooter />
      <ClientWidgets />
    </>
  );
}
