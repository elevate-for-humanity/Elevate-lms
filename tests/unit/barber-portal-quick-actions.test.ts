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

/** Canonical hrefs for the authenticated barber apprentice workspace. */
export const BARBER_PORTAL_QUICK_ACTION_HREFS = {
  clockIn: '/apprentice/timeclock',
  rtiCourse: `/lms/courses/${BARBER_COURSE_ID}`,
  logHours: '/apprentice/hours/log',
  logService: '/apprentice/competencies/log',
  uploadDocument: '/apprentice/documents',
  stateBoard: '/apprentice/state-board',
  billing: '/apprentice/billing',
  skills: '/apprentice/skills',
  workbook: '/apprentice/barber-apprenticeship/workbook',
  transferHours: '/apprentice/transfer-hours',
  orientation: '/apprentice/orientation?program=barber-apprenticeship',
  mobileApp: BARBER_STUDENT_APP_HOME,
} as const;

describe('barber apprentice portal quick actions', () => {
  it('uses Elevate/Prestige learner-facing labels without third-party vendor branding', () => {
    expect(apprenticeshipRtiLabel(SLUG)).toBe('Prestige Elevation Barber Curriculum');
    expect(apprenticeshipRtiLabel(SLUG, true)).toBe('Barber Curriculum');
  });

  it('keeps the RTI launch bound to the canonical barber course ID', () => {
    expect(apprenticeshipLmsCoursePath(SLUG)).toBe(`/lms/courses/${BARBER_COURSE_ID}`);
  });

  it('resolves operational actions inside the canonical apprentice workspace', () => {
    expect(apprenticeshipLmsCoursePath(SLUG)).toBe(BARBER_PORTAL_QUICK_ACTION_HREFS.rtiCourse);
    expect(apprenticeshipDocumentsPath(SLUG)).toBe(BARBER_PORTAL_QUICK_ACTION_HREFS.uploadDocument);
    expect(apprenticeshipOrientationPath(SLUG)).toBe(BARBER_PORTAL_QUICK_ACTION_HREFS.orientation);
    expect(apprenticeshipWorkbookHref(SLUG)).toBe(BARBER_PORTAL_QUICK_ACTION_HREFS.workbook);
  });

  it('exposes barber student mobile app download path', () => {
    expect(BARBER_PORTAL_QUICK_ACTION_HREFS.mobileApp).toBe('/pwa/barber');
  });
});
