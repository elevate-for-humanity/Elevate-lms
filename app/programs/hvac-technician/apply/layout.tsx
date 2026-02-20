import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Apply | HVAC Technician Program | Elevate for Humanity',
  description: 'Apply for the 20-week HVAC Technician program. Workforce Ready Grant and WIOA funding available.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/programs/hvac-technician/apply',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
