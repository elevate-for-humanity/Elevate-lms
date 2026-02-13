import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tax | Supersonicfastcash | Documents | Elevate for Humanity',
  description: 'Elevate for Humanity - Career training and workforce development programs.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/tax/supersonicfastcash/documents',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
