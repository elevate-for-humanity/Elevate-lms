/**
 * SEO Meta Tag Optimization
 * Generates optimized metadata for all page types
 */

import { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const baseUrl = PLATFORM_DEFAULTS.siteUrl;
const siteName = PLATFORM_DEFAULTS.orgName;
const defaultImage = `${baseUrl}/images/og-default.jpg`;

// Homepage Meta
export const homePageMeta: Metadata = {
  title: 'Free Job Training Programs | ${PLATFORM_DEFAULTS.orgName}',
  description:
    'Get trained for free in high-demand careers. WIOA-funded programs in barbering, healthcare, HVAC, and more. No debt. Real careers. Indiana.',
  keywords: [
    'free job training',
    'WIOA programs',
    'workforce development',
    'career training Indiana',
    'free certification programs',
  ],
  openGraph: {
    title: 'Free Job Training Programs | ${PLATFORM_DEFAULTS.orgName}',
    description: 'Get trained for free in high-demand careers. No debt. Real careers.',
    url: baseUrl,
    siteName,
    images: [{ url: defaultImage }],
    locale: 'en_US',
    type: 'website',
  },

  alternates: {
    canonical: baseUrl,
  },
};

// Program Page Meta Generator
export function generateProgramMeta(program: {
  name: string;
  description: string;
  duration: string;
  funding: string;
  slug: string;
  image?: string;
}): Metadata {
  const title = `${program.name} Training | Free Certification | Elevate for Humanity`;
  const description = `Free ${program.name} training with certification. ${program.duration}, ${program.funding} funded. Start your career in ${program.name.toLowerCase()}. Apply now.`;
  const url = `${baseUrl}/programs/${program.slug}`;

  return {
    title,
    description,
    keywords: [
      `${program.name.toLowerCase()} training`,
      `free ${program.name.toLowerCase()} certification`,
      `${program.name.toLowerCase()} career`,
      'WIOA training',
    ],
    openGraph: {
      title,
      description,
      url,
      siteName,
      images: [{ url: program.image || defaultImage }],
      type: 'website',
    },

    alternates: {
      canonical: url,
    },
  };
}

// Blog Post Meta Generator
export function generateBlogMeta(post: {
  title: string;
  excerpt: string;
  slug: string;
  author: string;
  publishedAt: string;
  image?: string;
  category?: string;
}): Metadata {
  const title = `${post.title} | ${PLATFORM_DEFAULTS.orgName} Blog`;
  const description = post.excerpt.substring(0, 160);
  const url = `${baseUrl}/blog/${post.slug}`;

  return {
    title,
    description,
    keywords: [post.category || 'workforce development', 'career training', 'job training'],
    authors: [{ name: post.author }],
    openGraph: {
      title: post.title,
      description,
      url,
      siteName,
      images: [{ url: post.image || defaultImage }],
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author],
    },

    alternates: {
      canonical: url,
    },
  };
}

// Application Page Meta
export const applicationPageMeta: Metadata = {
  title: 'Apply for Free Job Training | ${PLATFORM_DEFAULTS.orgName}',
  description:
    'Apply now for free workforce training. WIOA, WRG, and JRI funding available. Start your career transformation today.',
  keywords: [
    'apply for training',
    'WIOA application',
    'free training application',
    'career training enrollment',
  ],
  openGraph: {
    title: 'Apply for Free Job Training',
    description: 'Start your career transformation today. Apply now.',
    url: `${baseUrl}/apply`,
    siteName,
    images: [{ url: defaultImage }],
    type: 'website',
  },
  alternates: {
    canonical: `${baseUrl}/apply`,
  },
};

// Contact Page Meta
export const contactPageMeta: Metadata = {
  title: 'Contact Us | ${PLATFORM_DEFAULTS.orgName}',
  description:
    "Get in touch with ${PLATFORM_DEFAULTS.orgName}. Questions about programs, enrollment, or funding? We're here to help.",
  openGraph: {
    title: 'Contact Us | ' + PLATFORM_DEFAULTS.orgName + '',
    description: "Questions about programs, enrollment, or funding? We're here to help.",
    url: `${baseUrl}/contact`,
    siteName,
    type: 'website',
  },
  alternates: {
    canonical: `${baseUrl}/contact`,
  },
};

// Grants Page Meta
export const grantsPageMeta: Metadata = {
  title: 'Federal Grant Opportunities | SAM.gov | ${PLATFORM_DEFAULTS.orgName}',
  description:
    'Search federal grant and contract opportunities from SAM.gov. Find funding for workforce development, education, and community programs.',
  keywords: [
    'federal grants',
    'SAM.gov',
    'government contracts',
    'grant opportunities',
    'federal funding',
  ],
  openGraph: {
    title: 'Federal Grant Opportunities | SAM.gov',
    description: 'Search federal grant and contract opportunities.',
    url: `${baseUrl}/grants`,
    siteName,
    type: 'website',
  },
  alternates: {
    canonical: `${baseUrl}/grants`,
  },
};

// Policy Page Meta Generator
export function generatePolicyMeta(policy: {
  name: string;
  description: string;
  slug: string;
}): Metadata {
  const title = `${policy.name} | ${PLATFORM_DEFAULTS.orgName}`;
  const url = `${baseUrl}/policies/${policy.slug}`;

  return {
    title,
    description: policy.description,
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: url,
    },
  };
}

// Helper: Truncate description to optimal length
export function truncateDescription(text: string, maxLength: number = 160): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

// Helper: Generate keywords from text
export function generateKeywords(text: string, baseKeywords: string[] = []): string[] {
  const commonWords = [
    'the',
    'a',
    'an',
    'and',
    'or',
    'but',
    'in',
    'on',
    'at',
    'to',
    'for',
    'of',
    'with',
    'by',
  ];
  const words = text
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 3 && !commonWords.includes(word))
    .slice(0, 5);

  return [...new Set([...baseKeywords, ...words])];
}
