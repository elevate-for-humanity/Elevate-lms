import { redirect } from 'next/navigation';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Program pricing, payment plans, and funding options at Elevate for Humanity.',
};


// Single entry point for pricing: /store/licenses
export default function PricingRedirect() {
  redirect('/store/licenses');
}
