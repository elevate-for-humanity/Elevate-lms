import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Billing Settings | Elevate LMS',
  description: 'Manage payment methods and view billing history.',
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
