import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const PROGRAM_ALIASES: Record<string, string> = {
  'medical-assistant': 'medical-assistant',
  phlebotomy: 'phlebotomy',
  'hvac-technician': 'hvac-technician',
  barber: 'barber-apprenticeship',
  cosmetology: 'cosmetology-apprenticeship',
  cna: 'cna',
};

/**
 * Legacy v2 application compatibility route.
 * Training applications are forwarded into the complete canonical student
 * intake. Testing-only legacy selections go to the Testing Center instead of
 * being forced into a training application that does not represent them.
 */
export default async function LegacyEnrollmentV2ApplyPage({
  searchParams,
}: {
  searchParams?: Promise<{ program?: string }>;
}) {
  const params = await searchParams;
  const requested = params?.program?.trim().toLowerCase() ?? '';

  if (requested === 'act-workkeys' || requested === 'epa-608') {
    redirect('/testing');
  }

  const program = PROGRAM_ALIASES[requested];
  redirect(program ? `/apply/student?program=${encodeURIComponent(program)}` : '/apply/student');
}
