import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Redirect-only route — verification is handled within the dashboard
export default function VerificationPage() {
  redirect('/program-holder/dashboard');
}
