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
 */
export default async function StudentApplicationPage({
  searchParams,
}: {
  searchParams: Promise<{ program?: string }>;
}) {
  const params = await searchParams;
  const program = resolveSlug(params?.program || '') || '';
  const query = new URLSearchParams();
  if (program) query.set('program', program);
  redirect(`/apply/student/interview${query.toString() ? `?${query.toString()}` : ''}`);
}
