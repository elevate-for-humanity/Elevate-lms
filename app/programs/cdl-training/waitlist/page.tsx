import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/** CDL enrollment is open — legacy waitlist URL sends applicants to apply. */
export default function CDLWaitlistRedirectPage() {
  redirect('/apply?program=cdl-training');
}
