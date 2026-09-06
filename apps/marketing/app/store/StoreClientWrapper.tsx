'use client';

import { useState, useEffect, useCallback, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import StoreGuideChat from '@/components/store/StoreGuideChat';
import GuidedTour from '@/components/store/GuidedTour';

interface StoreClientWrapperProps {
  children: ReactNode;
}

export default function StoreClientWrapper({ children }: StoreClientWrapperProps) {
  const pathname = usePathname();
  const demoRoute = pathname.startsWith('/store/demo');
  const [activeTourId, setActiveTourId] = useState<string | null>(null);

  useEffect(() => {
    const handleTourTrigger = (e: Event) => {
      const target = e.target as HTMLElement;
      const button = target.closest('[data-tour-trigger]');
      if (button) {
        const tourId = button.getAttribute('data-tour-trigger');
        if (tourId) setActiveTourId(tourId);
      }
    };

    document.addEventListener('click', handleTourTrigger);
    return () => document.removeEventListener('click', handleTourTrigger);
  }, []);

  const handleStartTour = useCallback((tourId: string) => {
    setActiveTourId(tourId);
  }, []);

  const handleTourComplete = useCallback(() => {
    setActiveTourId(null);
  }, []);

  return (
    <>
      {children}
      {!demoRoute && (
        <StoreGuideChat
          onStartTour={handleStartTour}
          forceOpen={pathname === '/store'}
        />
      )}
      {activeTourId && (
        <GuidedTour
          tourId={activeTourId}
          onComplete={handleTourComplete}
          onSkip={handleTourComplete}
          autoStart
        />
      )}
    </>
  );
}
