import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Billing | Elevate for Humanity',
  description: 'Manage your billing, view payment history, and update payment methods.',
  robots: { index: false, follow: false },
};

export default function BillingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
