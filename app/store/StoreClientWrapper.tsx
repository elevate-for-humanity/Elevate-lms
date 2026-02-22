'use client';

import { useState, useEffect, useCallback, ReactNode } from 'react';
import dynamic from 'next/dynamic';

// Lazy-load chat and tour — they aren't needed for initial render
const StoreGuideChat = dynamic(() => import('@/components/store/StoreGuideChat'), {
  ssr: false,
});
const GuidedTour = dynamic(() => import('@/components/store/GuidedTour'), {
  ssr: false,
});

interface StoreClientWrapperProps {
  children: ReactNode;
}

export default function StoreClientWrapper({ children }: StoreClientWrapperProps) {
  const [activeTourId, setActiveTourId] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  // Defer guide chat load until after page is interactive
  useEffect(() => {
    const timer = setTimeout(() => setShowGuide(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Handle tour trigger buttons
  useEffect(() => {
    const handleTourTrigger = (e: Event) => {
      const target = e.target as HTMLElement;
      const button = target.closest('[data-tour-trigger]');
      if (button) {
        const tourId = button.getAttribute('data-tour-trigger');
        if (tourId) {
          setActiveTourId(tourId);
        }
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
      
      {/* Store Guide Chat — deferred to avoid blocking initial paint */}
      {showGuide && <StoreGuideChat onStartTour={handleStartTour} />}
      
      {/* Guided Tour - Spotlight overlay */}
      {activeTourId && (
        <GuidedTour
          tourId={activeTourId}
          onComplete={handleTourComplete}
          onSkip={handleTourComplete}
          autoStart={true}
        />
      )}
    </>
  );
}
