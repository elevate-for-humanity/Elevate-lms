import { Metadata } from 'next';

const SITE_URL = 'https://www.elevateforhumanity.org';
const SITE_NAME = 'Elevate for Humanity';

/**
 * Authoritative SEO Metadata Configuration
 * 
 * Rules:
 * - One <title> per page, ≤ 60 characters
 * - One <meta name="description"> per page, 140–160 characters
 * - No duplicate titles or descriptions
 * - No keyword stuffing
 * - Plain English, human-readable
 * - Claims must align with authoritative documents
 */

// Global default metadata (fallback)
export const DEFAULT_METADATA: Metadata = {
  title: {
    default: 'Tax Preparation & Workforce Training Platform | Elevate for Humanity',
    template: '%s | Elevate for Humanity',
  },
  description: 'Professional tax preparation, workforce training, and learning services delivered through a secure, guided platform.',
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
  },
};

/**
 * Page-specific metadata definitions
 * Each entry provides title, description, and canonical URL
 */
export const PAGE_METADATA: Record<string, {
  title: string;
  description: string;
  path: string;
}> = {
  // Homepage
  home: {
    title: 'Professional Tax Preparation & Training Platform',
    description: 'Prepare and file taxes with confidence. Elevate for Humanity offers secure tax preparation, training, and guided support.',
    path: '/',
  },

  // LMS Landing (public)
  lms: {
    title: 'Learning Management System for Career & Training Programs',
    description: 'A structured learning platform for students, instructors, and administrators with clear progress and governance.',
    path: '/lms',
  },

  // Store
  store: {
    title: 'Services & Program Enrollment',
    description: 'Enroll in professional services and programs with transparent pricing and a clear post-purchase experience.',
    path: '/store',
  },

  // Supersonic Fast Cash (Tax)
  supersonicTax: {
    title: 'Tax Preparation Services | Supersonic Fast Cash LLC',
    description: 'File your taxes through a guided, secure process. Optional refund-based advance available to eligible filers.',
    path: '/supersonic-fast-cash',
  },

  // Security
  security: {
    title: 'Security & Data Protection',
    description: 'Learn how Elevate for Humanity protects data through secure systems, access controls, and responsible practices.',
    path: '/governance/security',
  },

  // Governance Index
  governance: {
    title: 'Authoritative Documentation Index',
    description: 'Platform governance and operations documentation. Single source of truth for security, compliance, LMS, store, and tax services.',
    path: '/governance',
  },

  // Programs
  programs: {
    title: 'Career Training Programs',
    description: 'Explore workforce training programs in healthcare, skilled trades, technology, and business with funding support.',
    path: '/programs',
  },

  // How It Works
  howItWorks: {
    title: 'How It Works',
    description: 'Learn how to apply, get approved, and start training through our workforce development programs.',
    path: '/how-it-works',
  },

  // WIOA Eligibility
  wioaEligibility: {
    title: 'WIOA Funding Eligibility',
    description: 'Check your eligibility for WIOA-funded training programs. Free career training for qualifying individuals.',
    path: '/wioa-eligibility',
  },

  // About
  about: {
    title: 'About Us',
    description: 'Elevate for Humanity connects workforce training, credentials, and community programs to funded pathways.',
    path: '/about',
  },

  // Contact
  contact: {
    title: 'Contact Us',
    description: 'Get in touch with Elevate for Humanity for questions about programs, enrollment, or partnership opportunities.',
    path: '/contact',
  },

  // Apply
  apply: {
    title: 'Apply Now',
    description: 'Start your application for free workforce training programs. Get approved and begin your career journey.',
    path: '/apply',
  },

  // Employers
  employers: {
    title: 'For Employers',
    description: 'Partner with Elevate for Humanity to access trained graduates, workforce solutions, and OJT funding.',
    path: '/employers',
  },

  // Privacy Policy
  privacy: {
    title: 'Privacy Policy',
    description: 'How Elevate for Humanity collects, uses, and protects your personal information.',
    path: '/privacy',
  },

  // Terms of Service
  terms: {
    title: 'Terms of Service',
    description: 'Terms and conditions for using Elevate for Humanity services and platform.',
    path: '/terms',
  },

  // Store Licenses
  storeLicenses: {
    title: 'Platform Licenses',
    description: 'License the Elevate for Humanity workforce training platform for your organization.',
    path: '/store/licenses',
  },

  // White Label
  whiteLabel: {
    title: 'White-Label Solutions',
    description: 'Deploy a branded workforce training platform with full LMS, payments, and compliance features.',
    path: '/white-label',
  },
};

/**
 * Generate metadata for a specific page
 */
export function generatePageMetadata(pageKey: keyof typeof PAGE_METADATA): Metadata {
  const page = PAGE_METADATA[pageKey];
  if (!page) {
    return DEFAULT_METADATA;
  }

  return {
    title: page.title,
    description: page.description,
    alternates: {
      canonical: `${SITE_URL}${page.path}`,
    },
    openGraph: {
      title: page.title,
      description: page.description,
      url: `${SITE_URL}${page.path}`,
      siteName: SITE_NAME,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: page.title,
      description: page.description,
    },
  };
}

/**
 * Generate metadata with custom overrides
 */
export function generateCustomMetadata(options: {
  title: string;
  description: string;
  path: string;
  noIndex?: boolean;
}): Metadata {
  return {
    title: options.title,
    description: options.description,
    alternates: {
      canonical: `${SITE_URL}${options.path}`,
    },
    openGraph: {
      title: options.title,
      description: options.description,
      url: `${SITE_URL}${options.path}`,
      siteName: SITE_NAME,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: options.title,
      description: options.description,
    },
    robots: options.noIndex ? { index: false, follow: false } : { index: true, follow: true },
  };
}
