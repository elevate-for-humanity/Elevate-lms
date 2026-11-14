import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Apply — Barber Apprenticeship',
  description:
    'Apply for the Barber Apprenticeship Program. Flexible payment options including workforce funding, payment plans, and BNPL. Start your licensed barber career.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/programs/barber-apprenticeship/apply',
  },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
