import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Checkout Success',
  robots: { index: false, follow: false },
};

export default function CheckoutSuccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
