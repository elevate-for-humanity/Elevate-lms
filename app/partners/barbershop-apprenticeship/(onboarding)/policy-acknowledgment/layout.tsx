import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Policy Acknowledgment | Elevate for Humanity',
  description: 'Review and acknowledge barbershop apprenticeship policies.',
};

export default function PolicyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
