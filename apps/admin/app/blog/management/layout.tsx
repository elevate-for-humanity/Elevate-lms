import { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Blog & Success Stories',
  description:
    `Read success stories from our graduates, workforce development insights, program updates, and career training tips from ${PLATFORM_DEFAULTS.orgName}.`,
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/blog',
    types: {
      'application/rss+xml': 'https://www.elevateforhumanity.org/blog/rss.xml',
    },
  },
  openGraph: {
    title: 'Blog & Success Stories',
    description: 'Success stories, workforce development insights, and career training updates.',
    url: 'https://www.elevateforhumanity.org/blog',
    type: 'website',
    images: [
      {
        url: '/images/pages/social-media-1.webp',
        width: 1200,
        height: 630,
        alt: 'Elevate For Humanity blog and success stories',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog & Success Stories',
    description: 'Success stories, workforce development insights, and career training updates.',
    images: ['/images/pages/social-media-1.webp'],
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
