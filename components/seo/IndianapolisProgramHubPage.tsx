import type { Metadata } from 'next';
import SeoAuthorityHubPage from '@/components/seo/SeoAuthorityHubPage';
import {
  BreadcrumbStructuredData,
  FAQStructuredData,
  ProgramStructuredData,
} from '@/components/seo/StructuredData';
import type { IndianapolisProgramHubConfig } from '@/data/seo/indianapolis-program-hubs';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export function indianapolisHubMetadata(config: IndianapolisProgramHubConfig): Metadata {
  const canonical = `https://www.elevateforhumanity.org/${config.slug}`;
  return {
    title: config.metadata.title,
    description: config.metadata.description,
    alternates: { canonical },
    openGraph: {
      title: config.metadata.ogTitle ?? config.metadata.title,
      description: config.metadata.description,
      url: canonical,
      siteName: PLATFORM_DEFAULTS.orgName,
      images: [
        {
          url: '/og-default.webp',
          width: 1200,
          height: 630,
          alt: config.breadcrumbLabel,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: config.metadata.ogTitle ?? config.metadata.title,
      description: config.metadata.twitterDescription ?? config.metadata.description,
      images: ['/og-default.webp'],
    },
  };
}

export function IndianapolisProgramHubPage({ config }: { config: IndianapolisProgramHubConfig }) {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Workforce Training Indianapolis', url: '/workforce-training-indianapolis' },
    ...(config.sectorHub
      ? [{ name: config.sectorHub.label, url: config.sectorHub.href }]
      : []),
    { name: config.breadcrumbLabel, url: `/${config.slug}` },
  ];

  return (
    <>
      <BreadcrumbStructuredData items={breadcrumbs} />
      <FAQStructuredData faqs={config.faqs} />
      <ProgramStructuredData
        name={config.programStructuredData.name}
        description={config.programStructuredData.description}
        url={`/${config.slug}`}
        category={config.programStructuredData.category}
      />
      <SeoAuthorityHubPage
        hero={config.hero}
        trustBadges={config.trustBadges}
        whoHeading={config.whoHeading}
        whoItems={config.whoItems}
        funding={config.funding}
        pathwaysHeading={config.pathwaysHeading}
        pathways={config.pathways}
        employer={config.employer}
        faqs={config.faqs}
        relatedLinks={config.relatedLinks}
        complianceNotes={config.complianceNotes}
        ctaHeading={config.ctaHeading}
        ctaSubtitle={config.ctaSubtitle}
        ctaPrimary={config.ctaPrimary}
        ctaSecondary={config.ctaSecondary}
      />
    </>
  );
}
