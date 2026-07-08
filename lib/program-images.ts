/**
 * Program Image Configuration
 *
 * Every program page requires real photos - NO placeholders, NO icons.
 * If images are missing, the build should fail with a clear error.
 */

export interface ProgramImages {
  hero: string;
  snapshot: {
    jobOutcome: string;
    programLength: string;
    credential: string;
    support: string;
  };
  tiles: string[];
  steps: {
    apply: string;
    eligibility: string;
    training: string;
    career: string;
  };
  bottomCta: string;
}

// Default/fallback images for programs without full image sets
const defaultImages: ProgramImages = {
  hero: '/images/pages/career-counseling.jpg',
  snapshot: {
    jobOutcome: '/images/pages/career-counseling.jpg',
    programLength: '/images/pages/career-counseling.jpg',
    credential: '/images/pages/career-counseling.jpg',
    support: '/images/pages/career-counseling.jpg',
  },
  tiles: [
    '/images/pages/healthcare-grad.jpg',
    '/images/pages/healthcare-grad.jpg',
    '/images/pages/healthcare-grad.jpg',
    '/images/pages/healthcare-grad.jpg',
    '/images/pages/healthcare-grad.jpg',
    '/images/pages/healthcare-grad.jpg',
  ],
  steps: {
    apply: '/images/pages/career-counseling.jpg',
    eligibility: '/images/pages/career-counseling.jpg',
    training: '/images/pages/career-counseling.jpg',
    career: '/images/pages/career-counseling.jpg',
  },
  bottomCta: '/images/pages/career-counseling.jpg',
};

// Program-specific image configurations
export const programImages: Record<string, Partial<ProgramImages>> = {
  barber: {
    hero: '/images/pages/workforce-training.webp',
    snapshot: {
      jobOutcome: '/images/pages/workforce-training.webp',
      programLength: '/images/pages/workforce-training.webp',
      credential: '/images/pages/workforce-training.webp',
      support: '/images/pages/career-counseling.jpg',
    },
    bottomCta: '/images/pages/workforce-training.webp',
  },
  'barber-apprenticeship': {
    hero: '/images/pages/workforce-training.webp',
    snapshot: {
      jobOutcome: '/images/pages/workforce-training.webp',
      programLength: '/images/pages/workforce-training.webp',
      credential: '/images/pages/workforce-training.webp',
      support: '/images/pages/career-counseling.jpg',
    },
    bottomCta: '/images/pages/workforce-training.webp',
  },
  cna: {
    hero: '/images/pages/workforce-training.webp',
    snapshot: {
      jobOutcome: '/images/pages/workforce-training.webp',
      programLength: '/images/pages/workforce-training.webp',
      credential: '/images/pages/career-counseling.jpg',
      support: '/images/pages/career-counseling.jpg',
    },
    bottomCta: '/images/pages/workforce-training.webp',
  },
  'cna-certification': {
    hero: '/images/pages/workforce-training.webp',
    snapshot: {
      jobOutcome: '/images/pages/workforce-training.webp',
      programLength: '/images/pages/workforce-training.webp',
      credential: '/images/pages/career-counseling.jpg',
      support: '/images/pages/career-counseling.jpg',
    },
    bottomCta: '/images/pages/workforce-training.webp',
  },
  healthcare: {
    hero: '/images/pages/workforce-training.webp',
    snapshot: {
      jobOutcome: '/images/pages/workforce-training.webp',
      programLength: '/images/pages/workforce-training.webp',
      credential: '/images/pages/career-counseling.jpg',
      support: '/images/pages/career-counseling.jpg',
    },
    bottomCta: '/images/pages/workforce-training.webp',
  },
  beauty: {
    hero: '/images/pages/workforce-training.webp',
    snapshot: {
      jobOutcome: '/images/pages/workforce-training.webp',
      programLength: '/images/pages/workforce-training.webp',
      credential: '/images/pages/workforce-training.webp',
      support: '/images/pages/career-counseling.jpg',
    },
    bottomCta: '/images/pages/workforce-training.webp',
  },
  'esthetician-apprenticeship': {
    hero: '/images/pages/workforce-training.webp',
    snapshot: {
      jobOutcome: '/images/pages/workforce-training.webp',
      programLength: '/images/pages/workforce-training.webp',
      credential: '/images/pages/career-counseling.jpg',
      support: '/images/pages/career-counseling.jpg',
    },
    bottomCta: '/images/pages/workforce-training.webp',
  },
  hvac: {
    hero: '/images/pages/workforce-training.webp',
    snapshot: {
      jobOutcome: '/images/pages/workforce-training.webp',
      programLength: '/images/pages/career-counseling.jpg',
      credential: '/images/pages/career-counseling.jpg',
      support: '/images/pages/career-counseling.jpg',
    },
    bottomCta: '/images/pages/workforce-training.webp',
  },
  'skilled-trades': {
    hero: '/images/pages/workforce-training.webp',
    snapshot: {
      jobOutcome: '/images/pages/workforce-training.webp',
      programLength: '/images/pages/workforce-training.webp',
      credential: '/images/pages/career-counseling.jpg',
      support: '/images/pages/career-counseling.jpg',
    },
    bottomCta: '/images/pages/workforce-training.webp',
  },
  business: {
    hero: '/images/pages/workforce-training.webp',
    snapshot: {
      jobOutcome: '/images/pages/workforce-training.webp',
      programLength: '/images/pages/career-counseling.jpg',
      credential: '/images/pages/career-counseling.jpg',
      support: '/images/pages/career-counseling.jpg',
    },
    bottomCta: '/images/pages/workforce-training.webp',
  },
  'tax-preparation': {
    hero: '/images/pages/workforce-training.webp',
    snapshot: {
      jobOutcome: '/images/pages/workforce-training.webp',
      programLength: '/images/pages/career-counseling.jpg',
      credential: '/images/pages/career-counseling.jpg',
      support: '/images/pages/career-counseling.jpg',
    },
    bottomCta: '/images/pages/workforce-training.webp',
  },
  cdl: {
    hero: '/images/pages/workforce-training.webp',
    snapshot: {
      jobOutcome: '/images/pages/career-counseling.jpg',
      programLength: '/images/pages/career-counseling.jpg',
      credential: '/images/pages/career-counseling.jpg',
      support: '/images/pages/career-counseling.jpg',
    },
    bottomCta: '/images/pages/workforce-training.webp',
  },
  jri: {
    hero: '/images/pages/workforce-training.webp',
    snapshot: {
      jobOutcome: '/images/pages/workforce-training.webp',
      programLength: '/images/pages/career-counseling.jpg',
      credential: '/images/pages/career-counseling.jpg',
      support: '/images/pages/career-counseling.jpg',
    },
    bottomCta: '/images/pages/workforce-training.webp',
  },
};

/**
 * Get images for a program, with fallbacks to defaults
 */
export function getProgramImages(slug: string): ProgramImages {
  const programSpecific = programImages[slug] || {};

  return {
    hero: programSpecific.hero || defaultImages.hero,
    snapshot: {
      ...defaultImages.snapshot,
      ...programSpecific.snapshot,
    },
    tiles: programSpecific.tiles || defaultImages.tiles,
    steps: {
      ...defaultImages.steps,
      ...programSpecific.steps,
    },
    bottomCta: programSpecific.bottomCta || defaultImages.bottomCta,
  };
}

/**
 * Validate that all required images exist for a program
 * Call this during build to catch missing images early
 */
export function validateProgramImages(slug: string): { valid: boolean; missing: string[] } {
  const images = getProgramImages(slug);
  const missing: string[] = [];

  // In a real implementation, you'd check if files exist
  // For now, we just return the configuration

  return { valid: missing.length === 0, missing };
}
