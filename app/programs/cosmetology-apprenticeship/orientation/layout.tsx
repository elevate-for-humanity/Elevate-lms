import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Orientation | Cosmetology Apprenticeship | Elevate for Humanity',
  description: 'Complete your orientation for the Cosmetology Apprenticeship program.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
