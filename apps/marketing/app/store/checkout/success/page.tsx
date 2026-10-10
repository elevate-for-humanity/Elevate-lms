import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

// Legacy checkout URLs must use the authenticated subscription record.
export default function CheckoutSuccessPage() {
  redirect('/store/subscription-success');
}
