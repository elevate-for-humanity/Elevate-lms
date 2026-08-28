import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { PROGRAMS } from '@/lib/programs/canonical-data';
import { BARBER_PRICING } from '@/lib/programs/pricing';

export default function StructuredData() {
  const barber = PROGRAMS['barber-apprenticeship'];
  const telephoneDigits = PLATFORM_DEFAULTS.supportPhone.replace(/\D/g, '');
  const telephone =
    telephoneDigits.length === 11 && telephoneDigits.startsWith('1')
      ? `+${telephoneDigits}`
      : `+1${telephoneDigits}`;
  const canonicalSiteUrl = 'https://www.elevateforhumanity.org';

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    '@id': `${canonicalSiteUrl}/#organization`,
    name: PLATFORM_DEFAULTS.orgName,
    legalName: `2Exclusive LLC-S d/b/a ${PLATFORM_DEFAULTS.orgLegalName}`,
    url: canonicalSiteUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${canonicalSiteUrl}/icon-512.png`,
      contentUrl: `${canonicalSiteUrl}/icon-512.png`,
      width: 512,
      height: 512,
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
      'https://www.facebook.com/profile.php?id=61571046346179',
      'https://linkedin.com/company/elevateforhumanity',
      'https://instagram.com/elevateforhumanity',
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
            description: `DOL Registered Apprenticeship with competency-based completion and ${barber.relatedInstructionHours} verified hours of Related Technical Instruction. Indiana licensing-hour and examination requirements are tracked separately.`,
            url: `${canonicalSiteUrl}/programs/barber-apprenticeship`,
            provider: { '@id': `${canonicalSiteUrl}/#organization` },
            offers: {
              '@type': 'Offer',
              price: String(BARBER_PRICING.fullPrice),
              priceCurrency: 'USD',
              url: `${canonicalSiteUrl}/programs/barber-apprenticeship/apply`,
            },
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Course',
            name: 'HVAC Technician Training',
            url: `${canonicalSiteUrl}/programs/hvac-technician`,
            provider: { '@id': `${canonicalSiteUrl}/#organization` },
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Course',
            name: 'Certified Nursing Assistant (CNA)',
            url: `${canonicalSiteUrl}/programs/cna`,
            provider: { '@id': `${canonicalSiteUrl}/#organization` },
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Course',
            name: 'IT Help Desk',
            url: `${canonicalSiteUrl}/programs/it-help-desk`,
            provider: { '@id': `${canonicalSiteUrl}/#organization` },
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Course',
            name: 'CDL Training',
            url: `${canonicalSiteUrl}/programs/cdl-training`,
            provider: { '@id': `${canonicalSiteUrl}/#organization` },
          },
        },
      ],
    },
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${canonicalSiteUrl}/#website`,
    url: canonicalSiteUrl,
    name: PLATFORM_DEFAULTS.orgName,
    description:
      'Career training, registered apprenticeship, workforce pathways, and testing services.',
    publisher: {
      '@id': `${canonicalSiteUrl}/#organization`,
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
