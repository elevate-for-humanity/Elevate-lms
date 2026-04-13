import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getStateConfig, STATE_SLUGS } from '@/config/states';
import { StateTaxPreparationPage } from '@/components/templates';

interface Props {
  params: Promise<{ state: string }>;
}

export function generateStaticParams() {
  return STATE_SLUGS.map((state) => ({ state }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state: slug } = await params;
  const state = getStateConfig(slug);
  if (!state) return {};
  return {
    title: `${state.taxPreparation.headline} | Supersonic Fast Cash`,
    description: state.taxPreparation.description,
    alternates: {
      canonical: `https://www.supersonicfastcash.com/tax-preparation-${state.slug}`,
    },
    openGraph: {
      title: `${state.taxPreparation.headline} | Supersonic Fast Cash`,
      description: state.taxPreparation.description,
      url: `https://www.supersonicfastcash.com/tax-preparation-${state.slug}`,
      siteName: 'Supersonic Fast Cash',
      images: [{ url: '/og-tax.jpg', width: 1200, height: 630, alt: `${state.name} Tax Preparation` }],
      type: 'website',
    },
  };
}

export default async function TaxPreparationStatePage({ params }: Props) {
  const { state: slug } = await params;
  const state = getStateConfig(slug);
  if (!state) notFound();
  return <StateTaxPreparationPage state={state} />;
}
