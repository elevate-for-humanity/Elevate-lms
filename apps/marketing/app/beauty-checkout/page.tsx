import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function RetiredCheckoutPage() {
  redirect('/programs/cosmetology-apprenticeship/apply');
}
