import { redirect } from 'next/navigation';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Billing',
  description: 'Manage your billing, payment methods, and invoices.',
};


export default function BillingPage() {
  redirect('/account/billing');
}
