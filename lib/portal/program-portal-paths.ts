import { isApprenticeshipSlug } from '@/lib/portal/apprenticeship-portal-paths';

/** Self-pay programs — never show WorkOne / WIOA intake checklist */
export const WORKONE_INELIGIBLE_PROGRAM_SLUGS = new Set(['barber-apprenticeship']);

const SELF_PAY_FUNDING_TYPES = new Set([
  'self-pay',
  'self-pay-full',
  'self-pay-plan',
  'self_pay',
]);

/** Apprentice onboarding stays inside the authenticated LMS session. */
export function apprenticeshipOrientationPath(programSlug: string): string {
  return `/apprentice/orientation?program=${encodeURIComponent(programSlug)}`;
}

/** Apprentice documents use one authenticated operational route. */
export function apprenticeshipDocumentsPath(_programSlug: string): string {
  return '/apprentice/documents';
}

/** Resolve the actual enrollment/course at request time; never pin a learner to a legacy ID. */
export function apprenticeshipLmsCoursePath(programSlug: string): string | null {
  return isApprenticeshipSlug(programSlug) ? '/apprentice/theory' : null;
}

export function apprenticeshipWorkbookHref(_programSlug: string): string {
  return '/workbooks';
}

export function apprenticeshipRtiLabel(programSlug: string, _short = false): string | null {
  if (!isApprenticeshipSlug(programSlug)) return null;
  const labels: Record<string, string> = {
    'barber-apprenticeship': 'Barber theory course',
    'cosmetology-apprenticeship': 'Cosmetology theory course',
    'esthetician-apprenticeship': 'Esthetics theory course',
    'nail-technician-apprenticeship': 'Nail technology theory course',
  };
  return labels[programSlug] || 'Assigned theory course';
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
