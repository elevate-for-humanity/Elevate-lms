import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { PROGRAMS } from '@/lib/programs/canonical-data';
import { BARBER_PRICING } from '@/lib/programs/pricing';
import { FEATURED_BEAUTY_HOST_PARTNERS } from '@/lib/apprenticeship-programs/host-partners';
import { organization } from '@/lib/config/organization';

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
      ...organization.postalAddress,
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
      'https://www.facebook.com/61578240192934/',
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

  const hostShopSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${canonicalSiteUrl}/#featured-host-shops`,
    name: 'Featured Indiana apprenticeship Host Shops',
    numberOfItems: FEATURED_BEAUTY_HOST_PARTNERS.length,
    itemListElement: FEATURED_BEAUTY_HOST_PARTNERS.map((shop, index) => {
      const publicUrls = [
        shop.websiteUrl,
        shop.bookingUrl,
        shop.socialUrl,
        shop.onlineListingUrl,
      ].filter((url): url is string => Boolean(url));
      const images = (shop.media ?? [])
        .filter((media) => media.kind !== 'video')
        .map((media) => `${canonicalSiteUrl}${media.src}`);

      return {
        '@type': 'ListItem',
        position: index + 1,
        url: `${canonicalSiteUrl}/host-shops/${shop.slug}`,
        item: {
          // Schema.org has no BarberShop type. HairSalon is the closest valid
          // business type; additionalType preserves the more specific meaning.
          '@type': shop.businessType === 'BarberShop' ? 'HairSalon' : (shop.businessType ?? 'LocalBusiness'),
          additionalType:
            shop.businessType === 'BarberShop'
              ? 'https://www.wikidata.org/wiki/Q133215'
              : undefined,
          '@id': `${canonicalSiteUrl}/host-shops/${shop.slug}#business`,
          name: shop.dba ?? shop.name,
          legalName: shop.dba ? shop.name : undefined,
          description: shop.marketingBlurb ?? shop.note,
          url: `${canonicalSiteUrl}/host-shops/${shop.slug}`,
          telephone: shop.phone,
          image: images.length ? images : undefined,
          sameAs: publicUrls.length ? publicUrls : undefined,
          address: {
            '@type': 'PostalAddress',
            streetAddress: shop.address,
            addressLocality: shop.city,
            addressRegion: shop.state,
            postalCode: shop.zip,
            addressCountry: 'US',
          },
        },
      };
    }),
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(hostShopSchema) }}
      />
    </>
  );
}
