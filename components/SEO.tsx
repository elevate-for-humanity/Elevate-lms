import Head from 'next/head';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  noindex?: boolean;
  keywords?: string[];
  author?: string;
  schema?: Record<string, unknown>[];
  breadcrumb?: { name: string; url: string }[];
  programData?: {
    name: string;
    description: string;
    provider: string;
    url: string;
    price?: string;
    currency?: string;
  };
  videoData?: {
    name: string;
    description: string;
    thumbnailUrl: string;
    uploadDate: string;
    duration?: string;
  };
}

export function SEO({
  title,
  description,
  canonical,
  ogImage = '/images/og-image.jpg',
  ogType = 'website',
  noindex = false,
  keywords = [],
  author,
  schema = [],
  breadcrumb,
  programData,
  videoData,
}: SEOProps) {
  const siteName = PLATFORM_DEFAULTS.orgName;
  const fullTitle = `${title} | ${siteName}`;
  const siteUrl = PLATFORM_DEFAULTS.siteUrl;
  const fullCanonical = canonical ? `${siteUrl}${canonical}` : siteUrl;
  const fullOgImage = ogImage.startsWith('http') ? ogImage : `${siteUrl}${ogImage}`;

  const jsonLdSchemas: string[] = [];

  // Organization Schema
  jsonLdSchemas.push(JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteName,
    url: siteUrl,
    logo: `${siteUrl}/images/logo.png`,
    description: 'AI-Powered Workforce Development Platform | Education, Apprenticeships, Credentials',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+1-314-0123',
      contactType: 'customer service',
      availableLanguage: 'English',
    },
    sameAs: [
      'https://www.linkedin.com/company/elevate-for-humanity',
      'https://twitter.com/elevateforhumanity',
    ],
  }));

  // Breadcrumb Schema
  if (breadcrumb && breadcrumb.length > 0) {
    jsonLdSchemas.push(JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
        ...breadcrumb.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 2,
          name: item.name,
          item: `${siteUrl}${item.url}`,
        })),
      ],
    }));
  }

  // Course Schema
  if (programData) {
    jsonLdSchemas.push(JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: programData.name,
      description: programData.description,
      provider: {
        '@type': 'Organization',
        name: programData.provider,
        url: siteUrl,
      },
      url: `${siteUrl}${programData.url}`,
      ...(programData.price && {
        offers: {
          '@type': 'Offer',
          price: programData.price.replace(/[^0-9.]/g, ''),
          priceCurrency: programData.currency || 'USD',
          availability: 'https://schema.org/InStock',
        },
      }),
    }));
  }

  // Video Schema
  if (videoData) {
    jsonLdSchemas.push(JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name: videoData.name,
      description: videoData.description,
      thumbnailUrl: videoData.thumbnailUrl,
      uploadDate: videoData.uploadDate,
      ...(videoData.duration && { duration: videoData.duration }),
      embedUrl: `${siteUrl}/api/embed/video`,
    }));
  }

  // FAQ Schema
  if (schema.length > 0) {
    schema.forEach((s) => {
      if (s['@type'] === 'FAQPage') {
        jsonLdSchemas.push(JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: s.mainEntity,
        }));
      }
    });
  }

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords.length > 0 && <meta name="keywords" content={keywords.join(', ')} />}
      {author && <meta name="author" content={author} />}
      <link rel="canonical" href={fullCanonical} />

      {noindex && <meta name="robots" content="noindex,nofollow" />}

      {/* Open Graph */}
      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={fullCanonical} />
      <meta property="og:image" content={fullOgImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="en_US" />
      <meta property="og:updated_time" content={new Date().toISOString()} />

      {/* Twitter/X Card - REMOVED per user request */}

      {/* Additional SEO */}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="theme-color" content="#0F4C81" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />

      {/* JSON-LD Structured Data */}
      {jsonLdSchemas.map((schemaJson, index) => (
        <script
          key={`jsonld-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: schemaJson }}
        />
      ))}
    </Head>
  );
}
