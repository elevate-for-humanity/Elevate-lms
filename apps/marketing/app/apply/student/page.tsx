import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { resolveSlug } from '@/lib/program-registry';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Apply for Career Training | Elevate for Humanity',
  description:
    'Complete your Elevate career-training application with PARIS by text or voice, in English or Spanish, while your progress is saved.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/apply/student',
  },
};

/**
 * Canonical student admissions entry.
 *
 * PARIS is the guided application surface. The conventional multi-step form is
 * retained at /apply/student/form as an accessibility/recovery fallback, but
 * both paths submit through the same /api/applications authority.
 * Production acceptance trigger: 2026-08-22 closeout verification.
 */
export default async function StudentApplicationPage({
  searchParams,
}: {
  searchParams: Promise<{
    program?: string;
    intent?: string;
    payment?: string;
    funding?: string;
    session_id?: string;
  }>;
}) {
  const params = await searchParams;
  const program = resolveSlug(params?.program || '') || '';
  // Keep the shopper's validated enrollment choices intact across the canonical PARIS redirect.
  const query = new URLSearchParams();
  if (program) query.set('program', program);
  if (params?.intent === 'enrollment') query.set('intent', 'enrollment');
  if (['full', 'plan', 'bnpl', 'success'].includes(params?.payment || '')) {
    query.set('payment', params.payment as string);
  }
  if (['self_pay', 'workone', 'wioa', 'grant', 'employer'].includes(params?.funding || '')) {
    query.set('funding', params.funding as string);
  }
  if (params?.session_id) query.set('session_id', params.session_id);
  redirect(`/apply/student/interview${query.toString() ? `?${query.toString()}` : ''}`);
}
