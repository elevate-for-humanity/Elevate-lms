import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
vi.mock('@/components/apprenticeship/RtiCourseCard', () => ({
  RtiCourseCard: () => <div>Training course</div>,
}));
vi.mock('@/components/portal/ApprenticeClockInStatus', () => ({
  ApprenticeClockInStatus: () => <div>Attendance</div>,
}));
vi.mock('@/components/portal/BarberStudentAppDownload', () => ({
  BarberStudentAppDownload: () => null,
}));
import {
  ApprenticePortalShell,
  APPRENTICE_PORTAL_CONFIGS,
} from '@/components/portal/ApprenticePortalShell';
describe('learner dashboard payment visibility', () => {
  it.each(Object.keys(APPRENTICE_PORTAL_CONFIGS))(
    'preserves billing on the %s apprentice dashboard',
    (key) => {
      const html = renderToStaticMarkup(
        <ApprenticePortalShell
          config={APPRENTICE_PORTAL_CONFIGS[key]}
          firstName="Learner"
          enrollment={{ id: 'enrollment', enrollment_state: 'active' }}
          hours={{ ojl: 10, rti: 5 }}
          docs={[]}
          billing={{
            weeklyPaymentCents: 15103,
            remainingBalance: 5000,
            setupFeePaid: false,
            fullyPaid: false,
            paymentStatus: 'past_due',
            bnplProvider: 'paypal',
          }}
        />,
      );
      expect(html).toContain('Training course');
      expect(html).toContain('href="/apprentice/billing"');
      expect(html).toContain('Tuition balance');
    },
  );
});
