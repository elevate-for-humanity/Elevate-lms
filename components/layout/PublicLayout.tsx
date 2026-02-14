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
      {/* Skip to main content link for accessibility */}
      <a 
        href="#main-content" 
        className="skip-to-main sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:bg-brand-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-md focus:outline-none focus:ring-2 focus:ring-white"
      >
        Skip to main content
      </a>
      
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
