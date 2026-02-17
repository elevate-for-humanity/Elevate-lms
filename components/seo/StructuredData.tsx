/**
 * Structured Data (JSON-LD) Components for SEO
 * Provides rich snippets in Google search results
 */

import Script from 'next/script';

const SITE_URL = 'https://www.elevateforhumanity.org';
const ORG_NAME = 'Elevate for Humanity';

interface CourseStructuredDataProps {
  name: string;
  description: string;
  provider?: string;
  url: string;
  image?: string;
  duration?: string;
  price?: number;
  priceCurrency?: string;
  rating?: number;
  reviewCount?: number;
  category?: string;
}

/**
 * Course structured data for rich snippets
 */
export function CourseStructuredData({
  name,
  description,
  provider = ORG_NAME,
  url,
  image,
  duration,
  price = 0,
  priceCurrency = 'USD',
  rating,
  reviewCount,
  category,
}: CourseStructuredDataProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name,
    description,
    provider: {
      '@type': 'Organization',
      name: provider,
      sameAs: SITE_URL,
    },
    url: `${SITE_URL}${url}`,
    ...(image && { image }),
    ...(duration && { 
      timeRequired: duration,
      hasCourseInstance: {
        '@type': 'CourseInstance',
        courseMode: 'blended',
        duration,
      }
    }),
    offers: {
      '@type': 'Offer',
      price,
      priceCurrency,
      availability: 'https://schema.org/InStock',
      url: `${SITE_URL}${url}`,
    },
    ...(rating && reviewCount && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: rating,
        reviewCount,
        bestRating: 5,
        worstRating: 1,
      },
    }),
    ...(category && { courseCode: category }),
    educationalCredentialAwarded: 'Certificate of Completion',
    inLanguage: 'en-US',
  };

  return (
    <Script
      id={`course-jsonld-${name.replace(/\s+/g, '-').toLowerCase()}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

interface ProgramStructuredDataProps {
  name: string;
  description: string;
  url: string;
  image?: string;
  duration?: string;
  tuition?: number;
  certification?: string;
  salaryRange?: string;
  category?: string;
}

/**
 * Educational Program structured data
 */
export function ProgramStructuredData({
  name,
  description,
  url,
  image,
  duration,
  tuition = 0,
  certification,
  salaryRange,
  category,
}: ProgramStructuredDataProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOccupationalProgram',
    name,
    description,
    url: `${SITE_URL}${url}`,
    provider: {
      '@type': 'EducationalOrganization',
      name: ORG_NAME,
      sameAs: SITE_URL,
      address: {
        '@type': 'PostalAddress',
        streetAddress: '8888 Keystone Crossing Suite 1300',
        addressLocality: 'Indianapolis',
        addressRegion: 'IN',
        postalCode: '46240',
        addressCountry: 'US',
      },
    },
    ...(image && { image }),
    ...(duration && { timeToComplete: duration }),
    ...(certification && { 
      educationalCredentialAwarded: certification,
      occupationalCredentialAwarded: {
        '@type': 'EducationalOccupationalCredential',
        credentialCategory: 'certificate',
        name: certification,
      },
    }),
    offers: {
      '@type': 'Offer',
      price: tuition,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      category: 'WIOA Eligible - May be free for qualifying students',
    },
    ...(salaryRange && {
      salaryUponCompletion: {
        '@type': 'MonetaryAmountDistribution',
        name: 'Expected Salary Range',
        currency: 'USD',
        description: salaryRange,
      },
    }),
    ...(category && { programType: category }),
    applicationDeadline: 'Rolling Admissions',
    financialAidEligible: 'Yes - WIOA, Pell Grant, State Funding',
  };

  return (
    <Script
      id={`program-jsonld-${name.replace(/\s+/g, '-').toLowerCase()}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * Organization structured data (for homepage/about)
 */
export function OrganizationStructuredData() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: ORG_NAME,
    alternateName: 'EFH',
    url: SITE_URL,
    logo: `${SITE_URL}/images/logo.png`,
    description: '100% free career training in healthcare, skilled trades, and technology. Get trained, get hired, get paid.',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '8888 Keystone Crossing Suite 1300',
      addressLocality: 'Indianapolis',
      addressRegion: 'IN',
      postalCode: '46240',
      addressCountry: 'US',
    },
    telephone: '+1-317-314-3757',
    email: 'info@elevateforhumanity.org',
    sameAs: [
      'https://www.linkedin.com/company/elevate-for-humanity',
      'https://www.facebook.com/profile.php?id=61571046346179',
      'https://www.youtube.com/@elevateforhumanity',
    ],
    foundingDate: '2024',
    areaServed: {
      '@type': 'State',
      name: 'Indiana',
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Career Training Programs',
      itemListElement: [
        { '@type': 'OfferCatalog', name: 'Healthcare Programs' },
        { '@type': 'OfferCatalog', name: 'Skilled Trades Programs' },
        { '@type': 'OfferCatalog', name: 'Technology Programs' },
        { '@type': 'OfferCatalog', name: 'Business Programs' },
      ],
    },
  };

  return (
    <Script
      id="organization-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * FAQ structured data
 */
export function FAQStructuredData({ 
  faqs 
}: { 
  faqs: Array<{ question: string; answer: string }> 
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <Script
      id="faq-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * Breadcrumb structured data
 */
export function BreadcrumbStructuredData({
  items,
}: {
  items: Array<{ name: string; url: string }>;
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  };

  return (
    <Script
      id="breadcrumb-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * Job Posting structured data (for career services)
 */
export function JobPostingStructuredData({
  title,
  description,
  company,
  location,
  salary,
  employmentType = 'FULL_TIME',
  datePosted,
  validThrough,
}: {
  title: string;
  description: string;
  company: string;
  location: string;
  salary?: { min: number; max: number };
  employmentType?: string;
  datePosted: string;
  validThrough?: string;
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title,
    description,
    datePosted,
    ...(validThrough && { validThrough }),
    employmentType,
    hiringOrganization: {
      '@type': 'Organization',
      name: company,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: location,
        addressRegion: 'IN',
        addressCountry: 'US',
      },
    },
    ...(salary && {
      baseSalary: {
        '@type': 'MonetaryAmount',
        currency: 'USD',
        value: {
          '@type': 'QuantitativeValue',
          minValue: salary.min,
          maxValue: salary.max,
          unitText: 'YEAR',
        },
      },
    }),
  };

  return (
    <Script
      id={`job-jsonld-${title.replace(/\s+/g, '-').toLowerCase()}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
