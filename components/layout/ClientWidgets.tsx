'use client';

// Client-only widgets that don't block page rendering
// These load after user interaction or idle time

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

// Lazy load chat widget - doesn't block initial render
const FloatingChatWidget = dynamic(
  () => import('@/components/FloatingChatWidget'),
  { ssr: false, loading: () => null }
);

// Lazy load sticky mobile CTA - shows on program pages
const StickyMobileCTA = dynamic(
  () => import('@/components/programs/StickyMobileCTA').then(mod => ({ default: mod.StickyMobileCTA })),
  { ssr: false, loading: () => null }
);

// Mobile bottom navigation for authenticated users
const BottomNav = dynamic(
  () => import('@/components/BottomNav').then(mod => ({ default: mod.BottomNav })),
  { ssr: false, loading: () => null }
);

// Search dialog - cmd+k global search
const SearchDialog = dynamic(
  () => import('@/components/SearchDialog').then(mod => ({ default: mod.SearchDialog })),
  { ssr: false, loading: () => null }
);

// Scroll unlock failsafe on route changes
const ScrollUnlocker = dynamic(
  () => import('@/components/ScrollUnlocker'),
  { ssr: false, loading: () => null }
);

// Version guard - auto-refresh on stale deployments
const VersionGuard = dynamic(
  () => import('@/components/VersionGuard').then(mod => ({ default: mod.VersionGuard })),
  { ssr: false, loading: () => null }
);

// Security monitor - tracks suspicious client-side activity
const SecurityMonitor = dynamic(
  () => import('@/components/SecurityMonitor').then(mod => ({ default: mod.SecurityMonitor })),
  { ssr: false, loading: () => null }
);

// Offline indicator - shows when user loses connectivity
const OfflineIndicator = dynamic(
  () => import('@/components/offline-indicator').then(mod => ({ default: mod.OfflineIndicator })),
  { ssr: false, loading: () => null }
);

// Sentry error monitoring init
const SentryInit = dynamic(
  () => import('@/components/sentry-init').then(mod => ({ default: mod.SentryInit })),
  { ssr: false, loading: () => null }
);

// GlobalAvatar removed — inline video section was appearing unexpectedly on portal pages

// Toast notifications — react-hot-toast uses CommonJS require('react') which
// Turbopack resolves to null on the server. Must be client-only.
const Toaster = dynamic(
  () => import('react-hot-toast').then(m => m.Toaster),
  { ssr: false, loading: () => null }
);

// Avatar is now added to each page individually via PageAvatar component
// This ensures proper positioning under hero banners

export default function ClientWidgets() {
  const [showChat, setShowChat] = useState(false);
  const [showDeferredWidgets, setShowDeferredWidgets] = useState(false);
  const pathname = usePathname();

  // Show sticky CTA on program pages, apply page, and inquiry page
  const showStickyCTA = pathname?.startsWith('/programs/') || 
                        pathname === '/apply' || 
                        pathname === '/inquiry' ||
                        pathname?.startsWith('/forms/');

  // Show bottom nav on authenticated app pages
  const showBottomNav = pathname?.startsWith('/lms') ||
                        pathname?.startsWith('/dashboard') ||
                        pathname?.startsWith('/achievements') ||
                        pathname?.startsWith('/leaderboard') ||
                        pathname?.startsWith('/profile') ||
                        pathname?.startsWith('/settings') ||
                        pathname?.startsWith('/notifications');

  useEffect(() => {
    // Defer chat widget loading:
    // 1. After 6 seconds idle, OR
    // 2. On first scroll, OR
    // 3. On user interaction

    let loaded = false;
    const loadChat = () => {
      if (!loaded) {
        loaded = true;
        setShowChat(true);
      }
    };

    // Load after 8 seconds idle
    const timer = setTimeout(loadChat, 8000);

    // Load on scroll
    const handleScroll = () => loadChat();
    window.addEventListener('scroll', handleScroll, { once: true, passive: true });

    // Load on any click
    const handleClick = () => loadChat();
    window.addEventListener('click', handleClick, { once: true });

    // Load deferred widgets after 4 seconds — keeps initial paint fast
    const deferredTimer = setTimeout(() => setShowDeferredWidgets(true), 4000);

    return () => {
      clearTimeout(timer);
      clearTimeout(deferredTimer);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('click', handleClick);
    };
  }, []);

  return (
    <>
      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: '12px',
            fontSize: '0.875rem',
            padding: '12px 16px',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />

      {/* Immediate: scroll unlock + version guard + sentry */}
      <ScrollUnlocker />
      <VersionGuard />
      <SentryInit />

      {/* Sticky Mobile CTA - Apply/Contact buttons on program pages */}
      {showStickyCTA && <StickyMobileCTA />}

      {/* Mobile bottom nav for authenticated pages */}
      {showBottomNav && <BottomNav />}
      
      {/* AI Chat Widget - deferred load for performance */}
      {showChat && <FloatingChatWidget />}

      {/* Deferred widgets - load after initial paint */}
      {showDeferredWidgets && (
        <>
          <SearchDialog />
          <SecurityMonitor />
          <OfflineIndicator />
        </>
      )}
    </>
  );
}
