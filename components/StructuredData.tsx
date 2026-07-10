import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
export default function StructuredData() {
  // Single unified Organization schema (combines EducationalOrganization + LocalBusiness)
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': ['EducationalOrganization', 'LocalBusiness'],
    '@id': 'https://www.elevateforhumanity.org/#organization',
    name: PLATFORM_DEFAULTS.orgName,
    legalName: `2Exclusive LLC-S d/b/a ${PLATFORM_DEFAULTS.orgName} Career & Technical Institute`,
    alternateName: 'Elevate 4 Humanity',
    url: PLATFORM_DEFAULTS.siteUrl,
    logo: {
      '@type': 'ImageObject',
      url: 'https://www.elevateforhumanity.org/logo.jpg',
      width: 341,
      height: 512,
    },
    image: 'https://www.elevateforhumanity.org/images/pages/workforce-training.webp',
    foundingDate: '2019',
    description:
      'Nonprofit workforce development institute in Indianapolis providing career training at no cost to eligible Indiana residents through WIOA and state funding. Programs in healthcare, skilled trades, technology, barbering, and business. Job placement assistance included.',
    slogan: 'This Is Not Graduation. This Is Elevation.',
    telephone: `+1-${PLATFORM_DEFAULTS.supportPhone}`,
    email: 'info@elevateforhumanity.org',
    founder: {
      '@type': 'Person',
      name: 'Elizabeth Lene Greene',
      jobTitle: 'Founder & CEO',
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: '8888 Keystone Crossing, Suite 1300',
      addressLocality: 'Indianapolis',
      addressRegion: 'IN',
      postalCode: '46240',
      addressCountry: 'US',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 39.9242,
      longitude: -86.1155,
    },
    areaServed: {
      '@type': 'State',
      name: 'Indiana',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      telephone: `+1-${PLATFORM_DEFAULTS.supportPhone}`,
      email: 'info@elevateforhumanity.org',
      availableLanguage: ['English', 'Spanish'],
    },
    sameAs: [
      'https://www.facebook.com/profile.php?id=61571046346179',
      'https://www.linkedin.com/in/elevate-for-humanity-b5a2b3339/',
      'https://www.instagram.com/elevateforhumanity',
      'https://www.youtube.com/@elevateforhumanity',
      // Government verification sources — crawlable authority signals
      'https://www.apprenticeship.gov/apprenticeship-finder',
      'https://www.intrain.in.gov/training-provider-search',
    ],
    priceRange: '$0 - $5,000',
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '17:00',
      },
    ],
    // aggregateRating intentionally omitted — fabricated review counts
    // violate Google's rich result policies and can trigger manual penalties.
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Career Training Programs',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Course',
            name: 'HVAC Technician Training',
            description:
              'EPA 608 certification prep and HVAC fundamentals. WIOA and Workforce Ready Grant eligible.',
            url: 'https://www.elevateforhumanity.org/programs/hvac-technician',
            provider: { '@id': 'https://www.elevateforhumanity.org/#organization' },
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Course',
            name: 'Barber Apprenticeship',
            description:
              'DOL-registered apprenticeship — 1,500 OJT hours. RAPIDS program 2025-IN-132301.',
            url: 'https://www.elevateforhumanity.org/programs/barber-apprenticeship',
            provider: { '@id': 'https://www.elevateforhumanity.org/#organization' },
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Course',
            name: 'CNA Training',
            description:
              'Indiana state-approved Certified Nursing Assistant training. WIOA eligible.',
            url: 'https://www.elevateforhumanity.org/programs/cna',
            provider: { '@id': 'https://www.elevateforhumanity.org/#organization' },
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Course',
            name: 'IT Help Desk',
            description: 'CompTIA A+ certification prep. WIOA and Workforce Ready Grant eligible.',
            url: 'https://www.elevateforhumanity.org/programs/it-help-desk',
            provider: { '@id': 'https://www.elevateforhumanity.org/#organization' },
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Course',
            name: 'CDL Training',
            description: 'Commercial Driver License Class A training. WIOA eligible.',
            url: 'https://www.elevateforhumanity.org/programs/cdl-training',
            provider: { '@id': 'https://www.elevateforhumanity.org/#organization' },
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Course',
            name: 'Peer Recovery Specialist',
            description: 'Indiana DMHA-aligned peer recovery certification.  eligible.',
            url: 'https://www.elevateforhumanity.org/programs/peer-recovery-specialist',
            provider: { '@id': 'https://www.elevateforhumanity.org/#organization' },
          },
        },
      ],
    },
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': 'https://www.elevateforhumanity.org/#website',
    url: PLATFORM_DEFAULTS.siteUrl,
    name: PLATFORM_DEFAULTS.orgName,
    description:
      'Career training at no cost to eligible Indiana residents. WIOA and state-funded programs in healthcare, trades, technology, and business.',
    publisher: {
      '@id': 'https://www.elevateforhumanity.org/#organization',
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://www.elevateforhumanity.org/search?q={search_term_string}',
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
