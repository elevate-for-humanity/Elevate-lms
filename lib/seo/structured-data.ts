import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { assets, url } from '@/lib/utils/url-factory';
// Structured Data (JSON-LD) for SEO

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'EducationalOrganization',
  name: PLATFORM_DEFAULTS.orgName,
  alternateName: 'Elevate For Humanity Career & Technical Institute',
  url: PLATFORM_DEFAULTS.siteUrl,
  logo: assets.logo,
  description:
    'Free career training in healthcare, skilled trades, and business. Get trained, get hired, get paid. No cost, no debt.',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Indianapolis',
    addressRegion: 'IN',
    addressCountry: 'US',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+1-317-314-3757',
    contactType: 'Admissions',
    email: 'info@www.elevateforhumanity.org',
  },
  sameAs: [
    'https://www.facebook.com/profile.php?id=61571046346179',
    'https://www.linkedin.com/company/elevate-for-humanity',
    '',
  ],
};

export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: PLATFORM_DEFAULTS.orgName,
  url: PLATFORM_DEFAULTS.siteUrl,
  potentialAction: {
    '@type': 'SearchAction',
    target: url('/search?q={search_term_string}'),
    'query-input': 'required name=search_term_string',
  },
};

export const courseSchema = (course: {
  name: string;
  description: string;
  provider: string;
  url: string;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'Course',
  name: course.name,
  description: course.description,
  provider: {
    '@type': 'Organization',
    name: course.provider,
    sameAs: PLATFORM_DEFAULTS.siteUrl,
  },
  url: course.url,
  hasCourseInstance: {
    '@type': 'CourseInstance',
    courseMode: 'onsite',
    courseWorkload: 'PT',
  },
});

export const breadcrumbSchema = (items: Array<{ name: string; url: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
});

export const faqSchema = (faqs: Array<{ question: string; answer: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
});

export const eventSchema = (event: {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  url: string;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'Event',
  name: event.name,
  description: event.description,
  startDate: event.startDate,
  endDate: event.endDate,
  location: {
    '@type': 'Place',
    name: event.location,
  },
  url: event.url,
  organizer: {
    '@type': 'Organization',
    name: PLATFORM_DEFAULTS.orgName,
    url: PLATFORM_DEFAULTS.siteUrl,
  },
});
