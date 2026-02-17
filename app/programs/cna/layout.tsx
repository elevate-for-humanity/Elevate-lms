import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CNA Training Program | Elevate for Humanity',
  description: 'Become a Certified Nursing Assistant. CNA training program with hands-on clinical experience. $1,200 tuition with payment plans.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/programs/cna',
  },
};

export default function CNALayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
