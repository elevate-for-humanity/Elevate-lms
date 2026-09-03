import { describe, expect, it } from 'vitest';
import { BARBER_COURSE_ID } from '@/lib/barber/pricing';
import { BARBER_STUDENT_APP_HOME } from '@/lib/barber/student-app';
import {
  apprenticeshipDocumentsPath,
  apprenticeshipLmsCoursePath,
  apprenticeshipOrientationPath,
  apprenticeshipRtiLabel,
  apprenticeshipWorkbookHref,
} from '@/lib/portal/program-portal-paths';

const SLUG = 'barber-apprenticeship';

/** Canonical hrefs for /portal/barber Quick Actions + resources (student portal). */
export const BARBER_PORTAL_QUICK_ACTION_HREFS = {
  clockIn: '/apprentice/timeclock',
  rtiCourse: `/lms/courses/${BARBER_COURSE_ID}`,
  logHours: '/apprentice/hours/log',
  logService: '/apprentice/competencies/log',
  uploadDocument: '/programs/barber-apprenticeship/documents',
  stateBoard: '/apprentice/state-board',
  billing: '/apprentice/billing',
  skills: '/apprentice/skills',
  workbook: `/lms/courses/${BARBER_COURSE_ID}?activity=reading`,
  transferHours: '/apprentice/transfer-hours',
  orientation: '/programs/barber-apprenticeship/orientation',
  mobileApp: BARBER_STUDENT_APP_HOME,
} as const;

describe('barber apprentice portal quick actions', () => {
  it('uses Prestige Elevation labels (not Milady)', () => {
    expect(apprenticeshipRtiLabel(SLUG)).toBe('Prestige Elevation Barber Curriculum');
    expect(apprenticeshipRtiLabel(SLUG, true)).toBe('Prestige Elevation Course');
  });

  it('workbook href targets canonical BARBER_COURSE_ID', () => {
    expect(apprenticeshipWorkbookHref(SLUG)).toContain(BARBER_COURSE_ID);
    expect(apprenticeshipWorkbookHref(SLUG)).toMatch(/\?activity=reading$/);
  });

  it('resolves canonical LMS and document paths', () => {
    expect(apprenticeshipLmsCoursePath(SLUG)).toBe(BARBER_PORTAL_QUICK_ACTION_HREFS.rtiCourse);
    expect(apprenticeshipDocumentsPath(SLUG)).toBe(BARBER_PORTAL_QUICK_ACTION_HREFS.uploadDocument);
    expect(apprenticeshipOrientationPath(SLUG)).toBe(BARBER_PORTAL_QUICK_ACTION_HREFS.orientation);
    expect(apprenticeshipWorkbookHref(SLUG)).toBe(BARBER_PORTAL_QUICK_ACTION_HREFS.workbook);
  });

  it('exposes barber student mobile app download path', () => {
    expect(BARBER_PORTAL_QUICK_ACTION_HREFS.mobileApp).toBe('/pwa/barber');
  });
});
