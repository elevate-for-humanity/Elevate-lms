import { siteConfig } from '@/lib/config/site';

interface CourseStructuredDataProps {
  course: {
    id: string;
    title: string;
    description: string;
    duration?: string;
    price?: number;
    image_url?: string;
    category?: string;
    instructor?: string;
  };
}

export function CourseStructuredData({ course }: CourseStructuredDataProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    '@id': `${siteConfig.url}/courses/${course.id}`,
    name: course.course_name,
    description: course.description,
    provider: {
      '@type': 'Organization',
      name: siteConfig.name,
      legalName: '2Exclusive LLC-S',
      url: siteConfig.url,
    },
    ...(course.duration && { timeRequired: course.duration }),
    ...(course.image_url && { image: course.image_url }),
    ...(course.category && { 
      courseCode: course.category,
      educationalCredentialAwarded: 'Certificate of Completion',
    }),
    ...(course.instructor && {
      instructor: {
        '@type': 'Person',
        name: course.instructor,
      },
    }),
    offers: {
      '@type': 'Offer',
      price: course.price || 0,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: `${siteConfig.url}/courses/${course.id}`,
      ...(course.price === 0 && { 
        description: 'Free with WIOA funding' 
      }),
    },
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'blended',
      courseWorkload: course.duration || 'PT40H',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface ProgramStructuredDataProps {
  program: {
    id: string;
    name: string;
    slug: string;
    description: string;
    duration_weeks?: number;
    price?: number;
    image_url?: string;
    category?: string;
    outcomes?: string[];
  };
}

export function ProgramStructuredData({ program }: ProgramStructuredDataProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOccupationalProgram',
    '@id': `${siteConfig.url}/programs/${program.slug}`,
    name: program.name,
    description: program.description,
    provider: {
      '@type': 'EducationalOrganization',
      name: siteConfig.name,
      legalName: '2Exclusive LLC-S',
      url: siteConfig.url,
      address: {
        '@type': 'PostalAddress',
        streetAddress: siteConfig.headquarters.address,
        addressLocality: siteConfig.headquarters.city,
        addressRegion: siteConfig.headquarters.stateAbbr,
        postalCode: siteConfig.headquarters.zip,
        addressCountry: 'US',
      },
    },
    ...(program.duration_weeks && {
      timeToComplete: `P${program.duration_weeks}W`,
      programPrerequisites: 'High school diploma or GED preferred',
    }),
    ...(program.image_url && { image: program.image_url }),
    ...(program.category && { 
      occupationalCategory: program.category,
      educationalProgramMode: 'full-time',
    }),
    ...(program.outcomes && {
      occupationalCredentialAwarded: program.outcomes.map(outcome => ({
        '@type': 'EducationalOccupationalCredential',
        credentialCategory: 'certificate',
        name: outcome,
      })),
    }),
    offers: {
      '@type': 'Offer',
      price: program.price || 0,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: `${siteConfig.url}/programs/${program.slug}`,
      category: 'WIOA Eligible',
    },
    financialAidEligible: 'WIOA',
    applicationDeadline: 'Rolling admissions',
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// FAQ structured data for program pages
interface FAQStructuredDataProps {
  faqs: Array<{ question: string; answer: string }>;
}

export function FAQStructuredData({ faqs }: FAQStructuredDataProps) {
  const schema = {
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
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// Breadcrumb structured data
interface BreadcrumbStructuredDataProps {
  items: Array<{ name: string; url: string }>;
}

export function BreadcrumbStructuredData({ items }: BreadcrumbStructuredDataProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
