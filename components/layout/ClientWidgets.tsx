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

// Lazy load funding toast - shows WIOA/free tuition info
const FundingToast = dynamic(
  () => import('@/components/ui/FundingToast'),
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

// Voice assistant - global voice interaction
const VoiceAssistant = dynamic(
  () => import('@/components/VoiceAssistant').then(mod => ({ default: mod.VoiceAssistant })),
  { ssr: false, loading: () => null }
);

// Global avatar guide
const GlobalAvatar = dynamic(
  () => import('@/components/GlobalAvatar'),
  { ssr: false, loading: () => null }
);

// Mobile voiceover for accessibility
const MobileVoiceOver = dynamic(
  () => import('@/components/MobileVoiceOver').then(mod => ({ default: mod.MobileVoiceOver })),
  { ssr: false, loading: () => null }
);

// Avatar is now added to each page individually via PageAvatar component
// This ensures proper positioning under hero banners

export default function ClientWidgets() {
  const [showChat, setShowChat] = useState(false);
  const [showFundingToast, setShowFundingToast] = useState(false);
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

    // Load after 6 seconds
    const timer = setTimeout(loadChat, 6000);

    // Load on scroll
    const handleScroll = () => loadChat();
    window.addEventListener('scroll', handleScroll, { once: true, passive: true });

    // Load on any click
    const handleClick = () => loadChat();
    window.addEventListener('click', handleClick, { once: true });

    // Show funding toast after short delay (handled internally by component)
    setShowFundingToast(true);

    // Load deferred widgets after 2 seconds
    const deferredTimer = setTimeout(() => setShowDeferredWidgets(true), 2000);

    return () => {
      clearTimeout(timer);
      clearTimeout(deferredTimer);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('click', handleClick);
    };
  }, []);

  return (
    <>
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
          <GlobalAvatar />
        </>
      )}
    </>
  );
}
