import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Update Password',
  description: 'Update your password to secure your account.',
};

export default function UpdatePasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
