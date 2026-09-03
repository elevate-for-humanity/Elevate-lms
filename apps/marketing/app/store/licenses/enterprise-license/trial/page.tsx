import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Canonical managed platform trial redirects to /store/trial. */
export default function EnterpriseLicenseTrialPage() {
  redirect('/store/trial');
}
