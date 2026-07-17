import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Unauthorized Access',
  description: 'You do not have permission to access this page.',
  robots: { index: false, follow: false },
};

export default function UnauthorizedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
