import { redirect } from 'next/navigation';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Checkout',
  description: 'Complete your enrollment payment securely.',
};


export default function CheckoutRedirect() {
  redirect('/store/licenses');
}
