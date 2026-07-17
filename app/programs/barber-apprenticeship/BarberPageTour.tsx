'use client';

import { GuidedTour, BARBER_PAGE_TOUR_STEPS } from '@/components/tours/GuidedTour';

export function BarberPageTour() {
  return (
    <GuidedTour
      tourId="barber-apprenticeship"
      steps={BARBER_PAGE_TOUR_STEPS}
      autoStart={false}
      showOnce={true}
    />
  );
}
