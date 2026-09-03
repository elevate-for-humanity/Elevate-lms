import type { Metadata } from 'next';
import StoreClientWrapper from './StoreClientWrapper';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const STORE_URL = 'https://www.elevateforhumanity.org/store';

export const metadata: Metadata = {
  title: 'Elevate Store | Workforce Software, Apps, Courses & Licensing',
  description:
    'Explore Elevate software, workforce-management tools, training technology, individual apps, course licensing, testing products, demos, subscriptions, and enterprise options.',
  keywords: [
    'workforce development software',
    'training provider software',
    'workforce LMS',
    'website builder for training providers',
    'AI workforce assistants',
    'course builder software',
    'apprenticeship management software',
    'testing center software',
    'workforce board software',
    'grant management software',
    'SAM.gov management tool',
    'training platform licensing',
  ],
  openGraph: {
    title: 'Elevate Store | Workforce Software, Apps, Courses & Licensing',
    description:
      'Software, apps, workforce tools, course licensing, demos, subscriptions, and enterprise options from Elevate for Humanity.',
    url: STORE_URL,
    siteName: PLATFORM_DEFAULTS.orgName,
    type: 'website',
    images: [
      {
        url: 'https://www.elevateforhumanity.org/images/og-store.jpg',
        width: 1200,
        height: 630,
        alt: 'Elevate Store',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Elevate Store | Workforce Software, Apps, Courses & Licensing',
    description:
      'Explore Elevate software, apps, workforce tools, course licensing, subscriptions, and enterprise options.',
    images: ['https://www.elevateforhumanity.org/images/og-store.jpg'],
  },
  alternates: {
    canonical: STORE_URL,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
};

const storeJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Elevate Store',
  url: STORE_URL,
  description:
    'Software, apps, training technology, workforce tools, course licensing, testing products, subscriptions, demos, and enterprise options from Elevate for Humanity.',
  isPartOf: {
    '@type': 'WebSite',
    name: PLATFORM_DEFAULTS.orgName,
    url: 'https://www.elevateforhumanity.org',
  },
  mainEntity: {
    '@type': 'ItemList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Platform Plans', url: `${STORE_URL}/plans` },
      { '@type': 'ListItem', position: 2, name: 'Apps & Tools', url: `${STORE_URL}/apps` },
      { '@type': 'ListItem', position: 3, name: 'Website Builder', url: `${STORE_URL}/apps/website-builder` },
      { '@type': 'ListItem', position: 4, name: 'SAM.gov Manager', url: `${STORE_URL}/apps/sam-gov` },
      { '@type': 'ListItem', position: 5, name: 'Grants Discovery', url: `${STORE_URL}/apps/grants` },
      { '@type': 'ListItem', position: 6, name: 'Course Builder', url: `${STORE_URL}/course-builder` },
      { '@type': 'ListItem', position: 7, name: 'Dev Studio', url: `${STORE_URL}/dev-studio` },
      { '@type': 'ListItem', position: 8, name: 'Testing', url: `${STORE_URL}/testing` },
      { '@type': 'ListItem', position: 9, name: 'Licensing', url: `${STORE_URL}/licenses` },
      { '@type': 'ListItem', position: 10, name: 'Practice Tests', url: `${STORE_URL}/practice-tests` },
      { '@type': 'ListItem', position: 11, name: 'Licensing Guide', url: `${STORE_URL}/guides/licensing` },
      { '@type': 'ListItem', position: 12, name: 'Demos', url: `${STORE_URL}/demo` },
    ],
  },
};

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreClientWrapper>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(storeJsonLd) }}
      />
      {children}
    </StoreClientWrapper>
  );
}
