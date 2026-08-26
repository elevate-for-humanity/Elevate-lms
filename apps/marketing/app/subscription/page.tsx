import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Subscription',
  robots: { index: false, follow: false },
};

export default function SubscriptionPage() {
  redirect('/store/plans');
}
