import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'License Purchase Success | Elevate for Humanity',
  robots: { index: false, follow: false },
};

export default function LicenseSuccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
