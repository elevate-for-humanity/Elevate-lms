import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shopping Cart | Elevate Shop',
  description: 'Review items in your shopping cart.',
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
