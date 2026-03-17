// Server Component - NO 'use client'
// Layout for public marketing pages - renders header/footer server-side

import { Suspense } from 'react';
import Header from '@/components/site/Header';
import ServerFooter from '@/components/site/ServerFooter';
import ClientWidgets from './ClientWidgets';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <>
      {/* Server-rendered header - always visible */}
      <Header />

      {/* Main content */}
      <Suspense>
        <main id="main-content" className="pt-[70px]" role="main" tabIndex={-1}>
          {children}
        </main>
      </Suspense>

      {/* Server-rendered footer - always visible */}
      <ServerFooter />

      {/* Client-only widgets (chat, analytics, etc.) */}
      <ClientWidgets />
    </>
  );
}
