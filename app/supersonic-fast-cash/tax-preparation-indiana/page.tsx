import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { STATES } from '@/config/states';
import { StateTaxPreparationPage } from '@/components/templates';

const state = STATES.indiana;

export const metadata: Metadata = {
  title: `${state.taxPreparation.headline} | Supersonic Fast Cash`,
  description: state.taxPreparation.description,
  openGraph: {
    title: `${state.taxPreparation.headline} | Supersonic Fast Cash`,
    description: state.taxPreparation.description,
    url: `https://www.supersonicfastcash.com/tax-preparation-${state.slug}`,
    siteName: 'Supersonic Fast Cash',
    images: [{ url: '/og-tax.jpg', width: 1200, height: 630, alt: `${state.name} Tax Preparation` }],
    type: 'website',
  },
};

export default function Page() {
  return <StateTaxPreparationPage state={state} />;
}
