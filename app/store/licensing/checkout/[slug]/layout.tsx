import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'License Checkout | Elevate for Humanity',
  robots: { index: false, follow: false },
};

export default function LicenseCheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
