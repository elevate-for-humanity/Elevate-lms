import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Payment Error',
  description: 'Something went wrong with your payment. Please try again or contact support.',
  robots: { index: false, follow: false },
};

export default function PaymentErrorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
