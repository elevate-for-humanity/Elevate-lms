import { describe, expect, it } from 'vitest';
import { getNextRequiredAction } from '@/lib/enrollment/gate';
import { BARBER_COURSE_ID } from '@/lib/barber/constants';

describe('getNextRequiredAction', () => {
  it('routes barber apprentices to the Prestige Elevation LMS course', () => {
    const action = getNextRequiredAction({
      status: 'active',
      orientation_completed_at: '2026-01-01T00:00:00Z',
      documents_submitted_at: '2026-01-02T00:00:00Z',
      program_slug: 'barber-apprenticeship',
    });

    expect(action.href).toBe(`/lms/courses/${BARBER_COURSE_ID}`);
    expect(action.href).not.toContain('/apprentice/courses/');
  });
});
