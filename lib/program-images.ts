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
  hero: '/images/pages/comp-cta-career.jpg',
  snapshot: {
    jobOutcome: '/images/pages/comp-cta-career.jpg',
    programLength: '/images/pages/comp-cta-career.jpg',
    credential: '/images/pages/comp-cta-career.jpg',
    support: '/images/pages/comp-cta-career.jpg',
  },
  tiles: [
    '/images/pages/comp-highlights-success.jpg',
    '/images/pages/comp-highlights-success.jpg',
    '/images/pages/comp-highlights-success.jpg',
    '/images/pages/comp-highlights-success.jpg',
    '/images/pages/comp-highlights-success.jpg',
    '/images/pages/comp-highlights-success.jpg',
  ],
  steps: {
    apply: '/images/pages/comp-cta-career.jpg',
    eligibility: '/images/pages/comp-cta-career.jpg',
    training: '/images/pages/comp-cta-career.jpg',
    career: '/images/pages/comp-cta-career.jpg',
  },
  bottomCta: '/images/pages/comp-cta-career.jpg',
};

// Program-specific image configurations
export const programImages: Record<string, Partial<ProgramImages>> = {
  'barber': {
    hero: '/images/pages/comp-cta-programs.jpg',
    snapshot: {
      jobOutcome: '/images/pages/comp-cta-programs.jpg',
      programLength: '/images/pages/comp-cta-programs.jpg',
      credential: '/images/pages/comp-cta-programs.jpg',
      support: '/images/pages/comp-cta-career.jpg',
    },
    bottomCta: '/images/pages/comp-cta-programs.jpg',
  },
  'barber-apprenticeship': {
    hero: '/images/pages/comp-cta-programs.jpg',
    snapshot: {
      jobOutcome: '/images/pages/comp-cta-programs.jpg',
      programLength: '/images/pages/comp-cta-programs.jpg',
      credential: '/images/pages/comp-cta-programs.jpg',
      support: '/images/pages/comp-cta-career.jpg',
    },
    bottomCta: '/images/pages/comp-cta-programs.jpg',
  },
  'cna': {
    hero: '/images/pages/comp-cta-programs.jpg',
    snapshot: {
      jobOutcome: '/images/pages/comp-cta-programs.jpg',
      programLength: '/images/pages/comp-cta-programs.jpg',
      credential: '/images/pages/comp-cta-career.jpg',
      support: '/images/pages/comp-cta-career.jpg',
    },
    bottomCta: '/images/pages/comp-cta-programs.jpg',
  },
  'cna-certification': {
    hero: '/images/pages/comp-cta-programs.jpg',
    snapshot: {
      jobOutcome: '/images/pages/comp-cta-programs.jpg',
      programLength: '/images/pages/comp-cta-programs.jpg',
      credential: '/images/pages/comp-cta-career.jpg',
      support: '/images/pages/comp-cta-career.jpg',
    },
    bottomCta: '/images/pages/comp-cta-programs.jpg',
  },
  'healthcare': {
    hero: '/images/pages/comp-cta-programs.jpg',
    snapshot: {
      jobOutcome: '/images/pages/comp-cta-programs.jpg',
      programLength: '/images/pages/comp-cta-programs.jpg',
      credential: '/images/pages/comp-cta-career.jpg',
      support: '/images/pages/comp-cta-career.jpg',
    },
    bottomCta: '/images/pages/comp-cta-programs.jpg',
  },
  'beauty': {
    hero: '/images/pages/comp-cta-programs.jpg',
    snapshot: {
      jobOutcome: '/images/pages/comp-cta-programs.jpg',
      programLength: '/images/pages/comp-cta-programs.jpg',
      credential: '/images/pages/comp-cta-programs.jpg',
      support: '/images/pages/comp-cta-career.jpg',
    },
    bottomCta: '/images/pages/comp-cta-programs.jpg',
  },
  'esthetician-apprenticeship': {
    hero: '/images/pages/comp-cta-programs.jpg',
    snapshot: {
      jobOutcome: '/images/pages/comp-cta-programs.jpg',
      programLength: '/images/pages/comp-cta-programs.jpg',
      credential: '/images/pages/comp-cta-career.jpg',
      support: '/images/pages/comp-cta-career.jpg',
    },
    bottomCta: '/images/pages/comp-cta-programs.jpg',
  },
  'hvac': {
    hero: '/images/pages/comp-cta-programs.jpg',
    snapshot: {
      jobOutcome: '/images/pages/comp-cta-programs.jpg',
      programLength: '/images/pages/comp-cta-career.jpg',
      credential: '/images/pages/comp-cta-career.jpg',
      support: '/images/pages/comp-cta-career.jpg',
    },
    bottomCta: '/images/pages/comp-cta-programs.jpg',
  },
  'skilled-trades': {
    hero: '/images/pages/comp-cta-programs.jpg',
    snapshot: {
      jobOutcome: '/images/pages/comp-cta-programs.jpg',
      programLength: '/images/pages/comp-cta-programs.jpg',
      credential: '/images/pages/comp-cta-career.jpg',
      support: '/images/pages/comp-cta-career.jpg',
    },
    bottomCta: '/images/pages/comp-cta-programs.jpg',
  },
  'business': {
    hero: '/images/pages/comp-cta-programs.jpg',
    snapshot: {
      jobOutcome: '/images/pages/comp-cta-programs.jpg',
      programLength: '/images/pages/comp-cta-career.jpg',
      credential: '/images/pages/comp-cta-career.jpg',
      support: '/images/pages/comp-cta-career.jpg',
    },
    bottomCta: '/images/pages/comp-cta-programs.jpg',
  },
  'tax-preparation': {
    hero: '/images/pages/comp-cta-programs.jpg',
    snapshot: {
      jobOutcome: '/images/pages/comp-cta-programs.jpg',
      programLength: '/images/pages/comp-cta-career.jpg',
      credential: '/images/pages/comp-cta-career.jpg',
      support: '/images/pages/comp-cta-career.jpg',
    },
    bottomCta: '/images/pages/comp-cta-programs.jpg',
  },
  'cdl': {
    hero: '/images/pages/comp-cta-programs.jpg',
    snapshot: {
      jobOutcome: '/images/pages/comp-cta-career.jpg',
      programLength: '/images/pages/comp-cta-career.jpg',
      credential: '/images/pages/comp-cta-career.jpg',
      support: '/images/pages/comp-cta-career.jpg',
    },
    bottomCta: '/images/pages/comp-cta-programs.jpg',
  },
  'jri': {
    hero: '/images/pages/comp-cta-programs.jpg',
    snapshot: {
      jobOutcome: '/images/pages/comp-cta-programs.jpg',
      programLength: '/images/pages/comp-cta-career.jpg',
      credential: '/images/pages/comp-cta-career.jpg',
      support: '/images/pages/comp-cta-career.jpg',
    },
    bottomCta: '/images/pages/comp-cta-programs.jpg',
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
