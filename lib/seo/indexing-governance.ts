/**
 * INDEXING GOVERNANCE
 * 
 * This file defines the rules for what pages can be indexed.
 * It is the single source of truth for SEO indexing decisions.
 * 
 * WAVE 1: Core marketing, trust, and public informational pages
 * WAVE 2: High-quality resource guides (after 60 days of Wave 1 stability)
 */

export type IndexingWave = 'wave1' | 'wave2' | 'noindex';
export type PageCategory = 'core' | 'tax' | 'lms' | 'resources' | 'store';

/**
 * Indexing gates - ALL must pass for a page to be indexed
 */
export const INDEXING_GATES = {
  wave1: [
    'Public – no auth required',
    'Stable – content does not change per user',
    'Complete – no empty sections, no placeholders',
    'Canonical – one clean URL, no params',
    'Evergreen – valid for 6+ months',
    'Governed – aligned with authoritative documents',
  ],
  wave2: [
    'All Wave 1 gates pass',
    'Indexed in staging for review first',
    'Zero placeholder content',
    '800–1,500 words of original content (minimum)',
    'Evergreen for 12+ months',
    'Reviewed against Compliance & Disclosure Framework',
    'Linked from at least one Wave 1 page',
    'Has unique title + meta description',
    'Has a clear informational intent (not transactional)',
  ],
};

/**
 * Pages that are NEVER indexed (non-negotiable)
 */
export const NEVER_INDEX_PATTERNS = [
  '/api/*',
  '/auth/*',
  '/login',
  '/signup',
  '/dashboard/*',
  '/admin/*',
  '/instructor/*',
  '/creator/*',
  '/checkout/*',
  '/payment/*',
  '/learner/dashboard',
  '/lms/courses/*',  // Course interiors
  '/lms/assignments',
  '/lms/quizzes',
  '/lms/grades',
  '/lms/messages',
  '/lms/profile',
  '/lms/settings',
  '/*?*',  // Any URL with query params
];

/**
 * Wave 2 approved page types
 */
export const WAVE2_APPROVED_TYPES = {
  resourceGuides: {
    description: 'High-quality informational guides',
    urlPattern: '/resources/*',
    requirements: [
      'Informational, not advisory',
      'No promises',
      'No urgency',
      'Neutral tone',
      '800+ words',
    ],
    examples: [
      '/resources/how-tax-filing-works',
      '/resources/tax-refund-timeline-explained',
      '/resources/workforce-training-vs-traditional-education',
      '/resources/how-program-funding-works',
    ],
  },
  programExplainers: {
    description: 'Program overviews (not course content)',
    urlPattern: '/programs/*-overview',
    requirements: [
      'What the program is',
      'Who it\'s for',
      'How it works at high level',
      'No lesson content',
      'No enrollment pressure',
    ],
    examples: [
      '/programs/barber-apprenticeship-overview',
      '/programs/career-training-explained',
    ],
  },
  complianceExplainers: {
    description: 'Transparency and compliance information',
    urlPattern: '/resources/*',
    requirements: [
      'Factual explanation',
      'Links to authoritative documents',
      'No marketing language',
    ],
    examples: [
      '/resources/how-refund-advances-work',
      '/resources/understanding-tax-prep-fees',
      '/resources/data-protection-overview',
    ],
  },
};

/**
 * Internal linking rules for resource pages
 */
export const INTERNAL_LINKING_RULES = {
  required: [
    'Link upward to a Wave 1 page',
    'Link sideways to 1–2 related resources',
  ],
  forbidden: [
    'Never link directly into checkout flows',
    'Never link directly into gated/auth flows',
    'Never link to dynamic/personalized pages',
  ],
};

/**
 * Check if a URL matches any never-index pattern
 */
export function isNeverIndexed(url: string): boolean {
  return NEVER_INDEX_PATTERNS.some(pattern => {
    if (pattern.endsWith('*')) {
      return url.startsWith(pattern.slice(0, -1));
    }
    if (pattern.startsWith('*')) {
      return url.endsWith(pattern.slice(1));
    }
    if (pattern.includes('*')) {
      const [prefix, suffix] = pattern.split('*');
      return url.startsWith(prefix) && url.endsWith(suffix);
    }
    return url === pattern;
  });
}

/**
 * Resource page metadata requirements
 */
export interface ResourcePageMetadata {
  title: string;           // Clear, plain title (no clickbait)
  description: string;     // 140-160 chars
  lastReviewed: string;    // ISO date
  reviewedBy: string;      // Institutional role
  version?: string;        // Optional version number
  category: PageCategory;
  wave: IndexingWave;
}

/**
 * Validate resource page metadata
 */
export function validateResourceMetadata(meta: ResourcePageMetadata): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!meta.title || meta.title.length > 60) {
    errors.push('Title must be present and ≤60 characters');
  }

  if (!meta.description || meta.description.length < 140 || meta.description.length > 160) {
    errors.push('Description must be 140-160 characters');
  }

  if (!meta.lastReviewed) {
    errors.push('Last reviewed date is required');
  }

  if (!meta.reviewedBy) {
    errors.push('Reviewed by (institutional role) is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
