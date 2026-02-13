import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Supersonic fast cash | Admin | Client intake | Elevate for Humanity',
  description: 'Elevate for Humanity - Career training and workforce development programs.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/supersonic-fast-cash/admin/client-intake',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
