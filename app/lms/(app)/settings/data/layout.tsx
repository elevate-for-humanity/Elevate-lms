import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Data & Privacy Settings | Elevate LMS',
  description: 'Manage your data and privacy settings.',
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
