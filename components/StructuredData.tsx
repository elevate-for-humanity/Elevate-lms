export default function StructuredData() {
  // Single unified Organization schema (combines EducationalOrganization + LocalBusiness)
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': ['EducationalOrganization', 'LocalBusiness'],
    '@id': 'https://www.elevateforhumanity.org/#organization',
    name: 'Elevate for Humanity',
    legalName: 'Elevate for Humanity, Inc.',
    alternateName: 'Elevate 4 Humanity',
    url: 'https://www.elevateforhumanity.org',
    logo: {
      '@type': 'ImageObject',
      url: 'https://www.elevateforhumanity.org/logo.png',
      width: 250,
      height: 250,
    },
    image: 'https://www.elevateforhumanity.org/images/heroes-hq/programs-hero.jpg',
    description:
      'Career training at no cost to eligible participants in Indianapolis. WIOA-funded programs in HVAC, healthcare, barbering, and trades. No tuition, no debt. Job placement assistance.',
    slogan: 'This Is Not Graduation. This Is Elevation.',
    telephone: '+1-317-314-3757',
    email: 'our contact form',
    founder: {
      '@type': 'Person',
      name: 'Elizabeth Lene Greene',
      jobTitle: 'Founder & CEO',
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: '7009 East 56th Street, Suite EE1',
      addressLocality: 'Indianapolis',
      addressRegion: 'IN',
      postalCode: '46226',
      addressCountry: 'US',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 39.8386,
      longitude: -86.0586,
    },
    areaServed: {
      '@type': 'State',
      name: 'Indiana',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      telephone: '+1-317-314-3757',
      email: 'our contact form',
      availableLanguage: ['English', 'Spanish'],
    },
    sameAs: [
      'https://www.facebook.com/profile.php?id=61571046346179',
      'https://www.linkedin.com/in/elevate-for-humanity-b5a2b3339/',
      'https://www.instagram.com/elevateforhumanity',
      'https://www.youtube.com/@elevateforhumanity',
    ],
    priceRange: 'Free - $75,000',
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '17:00',
      },
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '127',
      bestRating: '5',
      worstRating: '1',
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Career Training Programs',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Course',
            name: 'HVAC Technician Training',
            description: 'Free HVAC training with EPA certification and job placement',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Course',
            name: 'Barber Apprenticeship',
            description: 'DOL registered apprenticeship program - 1500 hours',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Course',
            name: 'Direct Support Professional',
            description: 'Healthcare career training with certification',
          },
        },
      ],
    },
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': 'https://www.elevateforhumanity.org/#website',
    url: 'https://www.elevateforhumanity.org',
    name: 'Elevate for Humanity',
    description: 'Free career training in Indianapolis - WIOA funded programs',
    publisher: {
      '@id': 'https://www.elevateforhumanity.org/#organization',
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate:
          'https://www.elevateforhumanity.org/search?q={search_term_string}',
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
