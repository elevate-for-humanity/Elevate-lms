// Server Component - NO 'use client'
// Layout for public marketing pages - renders header/footer server-side

import Header from '@/components/site/Header';
import ServerFooter from '@/components/site/ServerFooter';
import ClientWidgets from './ClientWidgets';
import { SezzleBanner } from '@/components/checkout';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <>
      {/* SkipToContent is rendered in app/layout.tsx — no duplicate here */}
      
      {/* Server-rendered header - always visible */}
      <Header />
      
      {/* Sezzle Banner - Pay in 4 promotional banner */}
      <SezzleBanner theme="indigo" />
      
      {/* Main content */}
      <main id="main-content" className="pt-[70px]" role="main" tabIndex={-1}>
        {children}
      </main>
      
      {/* Server-rendered footer - always visible */}
      <ServerFooter />
      
      {/* Client-only widgets (chat, analytics, etc.) */}
      <ClientWidgets />
    </>
  );
}
