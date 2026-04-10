import { Metadata } from 'next';
import CosmetologyPartnerPageClient from './PartnerPageClient';

export const metadata: Metadata = {
  title: 'Salon Partner Program | Indiana Cosmetology Apprenticeship | Elevate for Humanity',
  description:
    'Become a host salon for the Indiana Cosmetology Apprenticeship program. Host apprentices, develop talent, and grow your team with structured training support.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/partners/cosmetology-apprenticeship',
  },
  openGraph: {
    title: 'Salon Partner Program | Indiana Cosmetology Apprenticeship',
    description: 'Host apprentices and develop talent for your salon with structured training support.',
    url: 'https://www.elevateforhumanity.org/partners/cosmetology-apprenticeship',
  },
};

export default function CosmetologyPartnerPage() {
  return <CosmetologyPartnerPageClient />;
}
