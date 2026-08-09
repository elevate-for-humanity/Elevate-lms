import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Legacy Barber-specific apprentice intake retained only for historical links.
 * The canonical student application owns applicant/funding/background/transfer
 * hour intake; payment remains on the program's server-priced payment tools.
 */
export default function BarberApprenticeApplyPage() {
  redirect('/apply/student?program=barber-apprenticeship');
}
