import { Metadata } from 'next';

export const metadata: Metadata = {
  title: ' | Elevate for Humanity',
  description: 'Elevate for Humanity - Career training and workforce development programs.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
