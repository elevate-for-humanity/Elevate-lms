'use client';

// Client-only widgets that don't block page rendering
// These load after user interaction or idle time

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

const LoadingDiv = () => <div className="hidden" />;

const StickyMobileCTA = dynamic(
  () =>
    import('@/components/programs/StickyMobileCTA').then(
      (mod) => mod.default || mod.StickyMobileCTA || mod,
    ),
  { ssr: false, loading: LoadingDiv },
);

const BottomNav = dynamic(
  () => import('@/components/BottomNav').then((mod) => mod.BottomNav || mod.default || mod),
  { ssr: false, loading: LoadingDiv },
);

const ScrollUnlocker = dynamic(
  () => import('@/components/ScrollUnlocker').then((mod) => mod.default || mod),
  { ssr: false, loading: LoadingDiv },
);

const VersionGuard = dynamic(
  () => import('@/components/VersionGuard').then((mod) => mod.default || mod),
  { ssr: false, loading: LoadingDiv },
);

const SecurityMonitor = dynamic(
  () => import('@/components/SecurityMonitor').then((mod) => mod.default || mod),
  { ssr: false, loading: LoadingDiv },
);

const OfflineIndicator = dynamic(
  () =>
    import('@/components/offline-indicator').then(
      (mod) => mod.OfflineIndicator || mod.default || mod,
    ),
  { ssr: false, loading: LoadingDiv },
);

const SentryInit = dynamic(
  () => import('@/components/sentry-init').then((mod) => mod.default || mod),
  { ssr: false, loading: LoadingDiv },
);

const Toaster = dynamic(() => import('@/components/ToasterWrapper').then((m) => m.default || m), {
  ssr: false,
  loading: LoadingDiv,
});

const SearchDialog = dynamic(
  () => import('@/components/SearchDialog').then((mod) => mod.default || mod),
  { ssr: false, loading: LoadingDiv },
);

export default function ClientWidgets() {
  const [showDeferredWidgets, setShowDeferredWidgets] = useState(false);
  const pathname = usePathname();

  const showStickyCTA =
    pathname?.startsWith('/programs/') ||
    pathname === '/apply' ||
    pathname === '/inquiry' ||
    pathname?.startsWith('/forms/');

  // The learner mobile shell follows the same six core destinations as LMS desktop:
  // Home, Community, Learn, Events, Progress, AI Team.
  const showBottomNav =
    pathname?.startsWith('https://app.elevateforhumanity.org/lms') ||
    pathname?.startsWith('https://app.elevateforhumanity.org/lms/dashboard') ||
    pathname?.startsWith('/account/ai-team') ||
    pathname?.startsWith('https://app.elevateforhumanity.org/lms/achievements') ||
    pathname?.startsWith('/leaderboard') ||
    pathname?.startsWith('/profile') ||
    pathname?.startsWith('/settings') ||
    pathname?.startsWith('/notifications');

  const showSecurityMonitor =
    showBottomNav ||
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/instructor') ||
    pathname?.startsWith('/learner') ||
    pathname?.startsWith('/employer') ||
    pathname?.startsWith('/partner') ||
    pathname?.startsWith('https://app.elevateforhumanity.org/program-holder') ||
    pathname?.startsWith('/staff-portal');

  useEffect(() => {
    const deferredTimer = setTimeout(() => setShowDeferredWidgets(true), 4000);
    return () => clearTimeout(deferredTimer);
  }, []);

  return (
    <>
      <Toaster />
      <ScrollUnlocker />
      <VersionGuard />
      <SentryInit />
      {showStickyCTA && <StickyMobileCTA />}
      {showBottomNav && <BottomNav />}
      {showDeferredWidgets && (
        <>
          <SearchDialog />
          {showSecurityMonitor && <SecurityMonitor />}
          <OfflineIndicator />
        </>
      )}
    </>
  );
}
