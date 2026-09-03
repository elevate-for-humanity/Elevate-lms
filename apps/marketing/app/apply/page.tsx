import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Enrollment Application | Career Training & Workforce Funding Intake',
  description:
    'Start the complete Elevate student application for career training, workforce funding review, and enrollment.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/apply/student',
  },
};

/**
 * Canonical student application entry.
 *
 * Historical /apply rendered a second short intake that submitted to different
 * API fallbacks. Preserve old inbound links, but send every student into the
 * complete five-step application instead of creating a partial parallel record.
 * Employer and provider applications retain their explicit /apply/* routes.
 */
export default async function ApplyPage({
  searchParams,
}: {
  searchParams?: Promise<{ program?: string; payment?: string; funding?: string }>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  if (params?.program) query.set('program', params.program);
  if (params?.payment) query.set('payment', params.payment);
  if (params?.funding) query.set('funding', params.funding);

  const suffix = query.toString();
  redirect(`/apply/student${suffix ? `?${suffix}` : ''}`);
}
