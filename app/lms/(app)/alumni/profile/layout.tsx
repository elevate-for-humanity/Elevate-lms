import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Alumni Profile | Elevate LMS',
  description: 'Manage your alumni directory profile.',
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
