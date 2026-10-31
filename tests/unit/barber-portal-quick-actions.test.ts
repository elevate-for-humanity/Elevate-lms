import { describe, expect, it } from 'vitest';
import { BARBER_STUDENT_APP_HOME } from '@/lib/barber/student-app';
import { APPRENTICE_TIMECLOCK_URL } from '@/lib/portal/apprenticeship-portal-paths';
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
  clockIn: APPRENTICE_TIMECLOCK_URL,
  rtiCourse: '/apprentice/theory',
  logHours: '/apprentice/hours/log',
  logService: '/apprentice/competencies/log',
  uploadDocument: '/apprentice/documents',
  stateBoard: '/apprentice/state-board',
  billing: '/apprentice/billing',
  skills: '/apprentice/skills',
  workbook: '/workbooks',
  transferHours: '/apprentice/transfer-hours',
  orientation: '/apprentice/orientation?program=barber-apprenticeship',
  mobileApp: BARBER_STUDENT_APP_HOME,
} as const;

describe('barber apprentice portal quick actions', () => {
  it('uses a clear course label without a former holder name', () => {
    expect(apprenticeshipRtiLabel(SLUG)).toBe('Barber theory course');
    expect(apprenticeshipRtiLabel(SLUG, true)).toBe('Barber theory course');
  });

  it('resolves the RTI launch from the current enrollment', () => {
    expect(apprenticeshipLmsCoursePath(SLUG)).toBe('/apprentice/theory');
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
