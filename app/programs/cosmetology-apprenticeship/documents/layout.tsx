import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Documents | Cosmetology Apprenticeship | Elevate for Humanity',
  description: 'Upload required documents for the Cosmetology Apprenticeship program.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
