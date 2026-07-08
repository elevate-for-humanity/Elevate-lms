/**
 * Schema.org Structured Data
 * Generates JSON-LD for rich results
 */

import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import {
  Organization,
  WithContext,
  Course,
  Article,
  FAQPage,
  BreadcrumbList,
  EducationalOrganization,
} from 'schema-dts';

const baseUrl = PLATFORM_DEFAULTS.siteUrl;

// Organization Schema (Global)
export const organizationSchema: WithContext<Organization> = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: PLATFORM_DEFAULTS.orgName,
  url: baseUrl,
  logo: `${baseUrl}/images/logo.png`,
  description:
    'Free workforce training programs in high-demand careers. WIOA-funded training in barbering, healthcare, HVAC, and more.',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Indianapolis',
    addressRegion: 'IN',
    addressCountry: 'US',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+1-${PLATFORM_DEFAULTS.supportPhone}',
    contactType: 'Admissions',
    email: 'info@${PLATFORM_DEFAULTS.canonicalDomain}',
  },
  sameAs: [
    'https://www.facebook.com/share/1BUqvUAnCo/',
    'https://www.linkedin.com/company/elevateforhumanity',
    'https://www.instagram.com/elevateforhumanity',
  ],
};

// Educational Organization Schema
export const educationalOrganizationSchema: WithContext<EducationalOrganization> = {
  '@context': 'https://schema.org',
  '@type': 'EducationalOrganization',
  name: PLATFORM_DEFAULTS.orgName,
  url: baseUrl,
  description: 'Workforce development and career training programs',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Indianapolis',
    addressRegion: 'IN',
    addressCountry: 'US',
  },
};

// Course Schema Generator
export function generateCourseSchema(course: {
  name: string;
  description: string;
  duration: string;
  cost: string;
  provider: string;
  url: string;
}): WithContext<Course> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.name,
    description: course.description,
    provider: {
      '@type': 'Organization',
      name: course.provider,
      url: baseUrl,
    },
    offers: {
      '@type': 'Offer',
      price: course.cost === 'Free' ? '0' : course.cost,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'Blended',
      duration: course.duration,
    },
    url: course.url,
  };
}

// Article Schema Generator
export function generateArticleSchema(article: {
  title: string;
  description: string;
  author: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
  url: string;
}): WithContext<Article> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    author: {
      '@type': 'Organization',
      name: article.author,
      url: baseUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: PLATFORM_DEFAULTS.orgName,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/images/logo.png`,
      },
    },
    datePublished: article.datePublished,
    dateModified: article.dateModified || article.datePublished,
    image: article.image || `${baseUrl}/images/pages/social-media-1.webp`,
    url: article.url,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': article.url,
    },
  };
}

// FAQ Schema Generator
export function generateFAQSchema(
  faqs: Array<{ question: string; answer: string }>,
): WithContext<FAQPage> {
  return {
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
  };
}

// Breadcrumb Schema Generator
export function generateBreadcrumbSchema(
  breadcrumbs: Array<{ name: string; url: string }>,
): WithContext<BreadcrumbList> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}

// Helper to inject schema into page
export function injectSchema(schema: WithContext<any>) {
  return {
    __html: JSON.stringify(schema),
  };
}
