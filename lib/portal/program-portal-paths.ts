import { BARBER_COURSE_ID } from '@/lib/barber/pricing';
import {
  PRESTIGE_ELEVATION_BARBER_CURRICULUM,
  PRESTIGE_ELEVATION_BARBER_CURRICULUM_SHORT,
} from '@/lib/barber/branding';

/** Self-pay programs — never show WorkOne / WIOA intake checklist */
export const WORKONE_INELIGIBLE_PROGRAM_SLUGS = new Set(['barber-apprenticeship']);

const SELF_PAY_FUNDING_TYPES = new Set([
  'self-pay',
  'self-pay-full',
  'self-pay-plan',
  'self_pay',
]);

/** Canonical LMS course IDs for apprenticeship RTI. */
export const APPRENTICESHIP_LMS_COURSE_IDS: Record<string, string> = {
  'barber-apprenticeship': BARBER_COURSE_ID,
};

/** Apprentice onboarding stays inside the authenticated LMS session. */
export function apprenticeshipOrientationPath(programSlug: string): string {
  return `/apprentice/orientation?program=${encodeURIComponent(programSlug)}`;
}

/** Apprentice documents use one authenticated operational route. */
export function apprenticeshipDocumentsPath(_programSlug: string): string {
  return '/apprentice/documents';
}

export function apprenticeshipLmsCoursePath(programSlug: string): string | null {
  const courseId = APPRENTICESHIP_LMS_COURSE_IDS[programSlug];
  return courseId ? `/lms/courses/${courseId}` : null;
}

export function apprenticeshipWorkbookHref(programSlug: string): string {
  return `/apprentice/${programSlug}/workbook`;
}

export function apprenticeshipRtiLabel(programSlug: string, short = false): string | null {
  if (programSlug === 'barber-apprenticeship') {
    return short
      ? PRESTIGE_ELEVATION_BARBER_CURRICULUM_SHORT
      : PRESTIGE_ELEVATION_BARBER_CURRICULUM;
  }
  return APPRENTICESHIP_LMS_COURSE_IDS[programSlug] ? 'Online Course' : null;
}

export function isWorkoneChecklistEligibleApplication(app: {
  program_slug?: string | null;
  funding_type?: string | null;
}): boolean {
  const slug = app.program_slug ?? '';
  if (WORKONE_INELIGIBLE_PROGRAM_SLUGS.has(slug)) return false;
  const funding = (app.funding_type ?? '').toLowerCase();
  if (SELF_PAY_FUNDING_TYPES.has(funding)) return false;
  return true;
}
