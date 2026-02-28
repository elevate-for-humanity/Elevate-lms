import { Metadata } from 'next';
import PartnerPageClient from './PartnerPageClient';

export const metadata: Metadata = {
  title: 'Barbershop Partner Program | Indiana Barber Apprenticeship | Elevate for Humanity',
  description:
    'Become a worksite partner for the Indiana Barber Apprenticeship program. Host apprentices, develop talent, and grow your team with structured training support.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/partners/barbershop-apprenticeship',
  },
  openGraph: {
    title: 'Barbershop Partner Program | Indiana Barber Apprenticeship',
    description: 'Host apprentices and develop talent for your barbershop with structured training support.',
    url: 'https://www.elevateforhumanity.org/partners/barbershop-apprenticeship',
  },
};

export default function BarbershopPartnerPage() {
  return <PartnerPageClient />;
}
