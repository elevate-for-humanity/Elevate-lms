import { redirect } from 'next/navigation';

export default function PricingIndependentRedirect() {
  redirect('/store/licenses');
}
