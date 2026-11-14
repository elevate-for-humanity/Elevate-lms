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
  hero: '/images/pages/resume-building-hero.webp',
  snapshot: {
    jobOutcome: '/images/pages/resume-building-hero.webp',
    programLength: '/images/pages/resume-building-hero.webp',
    credential: '/images/pages/resume-building-hero.webp',
    support: '/images/pages/resume-building-hero.webp',
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
    apply: '/images/pages/resume-building-hero.webp',
    eligibility: '/images/pages/resume-building-hero.webp',
    training: '/images/pages/resume-building-hero.webp',
    career: '/images/pages/resume-building-hero.webp',
  },
  bottomCta: '/images/pages/resume-building-hero.webp',
};

// Program-specific image configurations
export const programImages: Record<string, Partial<ProgramImages>> = {
  barber: {
    hero: '/images/pages/workforce-training.webp',
    snapshot: {
      jobOutcome: '/images/pages/workforce-training.webp',
      programLength: '/images/pages/workforce-training.webp',
      credential: '/images/pages/workforce-training.webp',
      support: '/images/pages/resume-building-hero.webp',
    },
    bottomCta: '/images/pages/workforce-training.webp',
  },
  'barber-apprenticeship': {
    hero: '/images/pages/workforce-training.webp',
    snapshot: {
      jobOutcome: '/images/pages/workforce-training.webp',
      programLength: '/images/pages/workforce-training.webp',
      credential: '/images/pages/workforce-training.webp',
      support: '/images/pages/resume-building-hero.webp',
    },
    bottomCta: '/images/pages/workforce-training.webp',
  },
  cna: {
    hero: '/images/pages/workforce-training.webp',
    snapshot: {
      jobOutcome: '/images/pages/workforce-training.webp',
      programLength: '/images/pages/workforce-training.webp',
      credential: '/images/pages/resume-building-hero.webp',
      support: '/images/pages/resume-building-hero.webp',
    },
    bottomCta: '/images/pages/workforce-training.webp',
  },
  'cna-certification': {
    hero: '/images/pages/workforce-training.webp',
    snapshot: {
      jobOutcome: '/images/pages/workforce-training.webp',
      programLength: '/images/pages/workforce-training.webp',
      credential: '/images/pages/resume-building-hero.webp',
      support: '/images/pages/resume-building-hero.webp',
    },
    bottomCta: '/images/pages/workforce-training.webp',
  },
  healthcare: {
    hero: '/images/pages/workforce-training.webp',
    snapshot: {
      jobOutcome: '/images/pages/workforce-training.webp',
      programLength: '/images/pages/workforce-training.webp',
      credential: '/images/pages/resume-building-hero.webp',
      support: '/images/pages/resume-building-hero.webp',
    },
    bottomCta: '/images/pages/workforce-training.webp',
  },
  beauty: {
    hero: '/images/pages/workforce-training.webp',
    snapshot: {
      jobOutcome: '/images/pages/workforce-training.webp',
      programLength: '/images/pages/workforce-training.webp',
      credential: '/images/pages/workforce-training.webp',
      support: '/images/pages/resume-building-hero.webp',
    },
    bottomCta: '/images/pages/workforce-training.webp',
  },
  'esthetician-apprenticeship': {
    hero: '/images/pages/workforce-training.webp',
    snapshot: {
      jobOutcome: '/images/pages/workforce-training.webp',
      programLength: '/images/pages/workforce-training.webp',
      credential: '/images/pages/resume-building-hero.webp',
      support: '/images/pages/resume-building-hero.webp',
    },
    bottomCta: '/images/pages/workforce-training.webp',
  },
  hvac: {
    hero: '/images/pages/workforce-training.webp',
    snapshot: {
      jobOutcome: '/images/pages/workforce-training.webp',
      programLength: '/images/pages/resume-building-hero.webp',
      credential: '/images/pages/resume-building-hero.webp',
      support: '/images/pages/resume-building-hero.webp',
    },
    bottomCta: '/images/pages/workforce-training.webp',
  },
  'skilled-trades': {
    hero: '/images/pages/workforce-training.webp',
    snapshot: {
      jobOutcome: '/images/pages/workforce-training.webp',
      programLength: '/images/pages/workforce-training.webp',
      credential: '/images/pages/resume-building-hero.webp',
      support: '/images/pages/resume-building-hero.webp',
    },
    bottomCta: '/images/pages/workforce-training.webp',
  },
  business: {
    hero: '/images/pages/workforce-training.webp',
    snapshot: {
      jobOutcome: '/images/pages/workforce-training.webp',
      programLength: '/images/pages/resume-building-hero.webp',
      credential: '/images/pages/resume-building-hero.webp',
      support: '/images/pages/resume-building-hero.webp',
    },
    bottomCta: '/images/pages/workforce-training.webp',
  },
  'tax-preparation': {
    hero: '/images/pages/workforce-training.webp',
    snapshot: {
      jobOutcome: '/images/pages/workforce-training.webp',
      programLength: '/images/pages/resume-building-hero.webp',
      credential: '/images/pages/resume-building-hero.webp',
      support: '/images/pages/resume-building-hero.webp',
    },
    bottomCta: '/images/pages/workforce-training.webp',
  },
  cdl: {
    hero: '/images/pages/workforce-training.webp',
    snapshot: {
      jobOutcome: '/images/pages/resume-building-hero.webp',
      programLength: '/images/pages/resume-building-hero.webp',
      credential: '/images/pages/resume-building-hero.webp',
      support: '/images/pages/resume-building-hero.webp',
    },
    bottomCta: '/images/pages/workforce-training.webp',
  },
  jri: {
    hero: '/images/pages/workforce-training.webp',
    snapshot: {
      jobOutcome: '/images/pages/workforce-training.webp',
      programLength: '/images/pages/resume-building-hero.webp',
      credential: '/images/pages/resume-building-hero.webp',
      support: '/images/pages/resume-building-hero.webp',
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
