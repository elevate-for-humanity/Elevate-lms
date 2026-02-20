import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Apply | HVAC Technician Program | Elevate for Humanity',
  description: 'Enroll in the 20-week HVAC Technician program. Pay in full, weekly payments, or use Affirm/Sezzle BNPL financing.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/programs/hvac-technician/apply',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
