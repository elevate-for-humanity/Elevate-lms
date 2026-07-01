import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Notification Settings | Elevate LMS',
  description: 'Manage your notification preferences.',
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
