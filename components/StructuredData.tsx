import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { RAPIDS_CONFIG } from '@/lib/compliance/rapids-config';
import { BARBER_PRICING } from '@/lib/programs/pricing';

export default function StructuredData() {
  const barber = RAPIDS_CONFIG.programs.barber;
  const telephone = `+1${PLATFORM_DEFAULTS.supportPhone.replace(/\D/g, '')}`;

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    '@id': `${PLATFORM_DEFAULTS.siteUrl}/#organization`,
    name: PLATFORM_DEFAULTS.orgName,
    legalName: `2Exclusive LLC-S d/b/a ${PLATFORM_DEFAULTS.orgLegalName}`,
    url: PLATFORM_DEFAULTS.siteUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${PLATFORM_DEFAULTS.siteUrl}/images/Elevate_for_Humanity_logo_81bf0fab.jpg`,
    },
    description:
      'Career training, registered apprenticeship, workforce-development, testing, and employer-connected education services based in Indianapolis, Indiana.',
    telephone,
    email: PLATFORM_DEFAULTS.supportEmail,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Indianapolis',
      addressRegion: 'IN',
      addressCountry: 'US',
    },
    areaServed: {
      '@type': 'State',
      name: 'Indiana',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Admissions and Support',
      telephone,
      email: PLATFORM_DEFAULTS.supportEmail,
      availableLanguage: ['English'],
    },
    sameAs: [
      'https://www.instagram.com/elevateforhumanity',
      'https://www.youtube.com/@elevateforhumanity',
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Career Training Programs',
      itemListElement: [
        {
          '@type': 'Offer',
          priceCurrency: 'USD',
          itemOffered: {
            '@type': 'Course',
            name: barber.name,
            description: `DOL Registered Apprenticeship requiring ${barber.totalHours.toLocaleString()} supervised OJL hours plus ${barber.relatedInstructionHours} hours of Related Technical Instruction under the registered program standards.`,
            url: `${PLATFORM_DEFAULTS.siteUrl}/programs/barber-apprenticeship`,
            provider: { '@id': `${PLATFORM_DEFAULTS.siteUrl}/#organization` },
            offers: {
              '@type': 'Offer',
              price: String(BARBER_PRICING.fullPrice),
              priceCurrency: 'USD',
              url: `${PLATFORM_DEFAULTS.siteUrl}/programs/barber-apprenticeship/apply`,
            },
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Course',
            name: 'HVAC Technician Training',
            url: `${PLATFORM_DEFAULTS.siteUrl}/programs/hvac-technician`,
            provider: { '@id': `${PLATFORM_DEFAULTS.siteUrl}/#organization` },
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Course',
            name: 'Certified Nursing Assistant (CNA)',
            url: `${PLATFORM_DEFAULTS.siteUrl}/programs/cna`,
            provider: { '@id': `${PLATFORM_DEFAULTS.siteUrl}/#organization` },
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Course',
            name: 'IT Help Desk',
            url: `${PLATFORM_DEFAULTS.siteUrl}/programs/it-help-desk`,
            provider: { '@id': `${PLATFORM_DEFAULTS.siteUrl}/#organization` },
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Course',
            name: 'CDL Training',
            url: `${PLATFORM_DEFAULTS.siteUrl}/programs/cdl-training`,
            provider: { '@id': `${PLATFORM_DEFAULTS.siteUrl}/#organization` },
          },
        },
      ],
    },
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${PLATFORM_DEFAULTS.siteUrl}/#website`,
    url: PLATFORM_DEFAULTS.siteUrl,
    name: PLATFORM_DEFAULTS.orgName,
    description: 'Career training, registered apprenticeship, workforce pathways, and testing services.',
    publisher: {
      '@id': `${PLATFORM_DEFAULTS.siteUrl}/#organization`,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${PLATFORM_DEFAULTS.siteUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </>
  );
}
