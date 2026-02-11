import { redirect } from 'next/navigation';

// Single entry point for pricing: /store/licenses
export default function PricingRedirect() {
  redirect('/store/licenses');
}
