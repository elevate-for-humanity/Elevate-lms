import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Skilled Trades Training Programs | Elevate for Humanity',
  description: 'Free skilled trades training including HVAC, CDL, and Barber Apprenticeship. WIOA-funded programs with job placement support in Indianapolis.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/programs/skilled-trades',
  },
  openGraph: {
    title: 'Skilled Trades Training Programs | Elevate for Humanity',
    description: 'Start your trades career with funded training programs in Indianapolis.',
    url: 'https://www.elevateforhumanity.org/programs/skilled-trades',
  },
};

export default function SkilledTradesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
