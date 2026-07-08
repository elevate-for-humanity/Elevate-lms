// State configuration for SEO pages
// Single source of truth for state-specific content

export interface StateConfig {
  slug: string;
  name: string;
  abbreviation: string;
  demonym: string; // e.g., "Hoosiers" for Indiana
  majorCities: string[];
  careerTraining: {
    headline: string;
    description: string;
    features: string[];
  };
  communityServices: {
    headline: string;
    description: string;
  };
}

export const STATES: Record<string, StateConfig> = {
  indiana: {
    slug: 'indiana',
    name: 'Indiana',
    abbreviation: 'IN',
    demonym: 'Hoosiers',
    majorCities: [
      'Indianapolis',
      'Fort Wayne',
      'Evansville',
      'South Bend',
      'Carmel',
      'Fishers',
      'Bloomington',
    ],
    careerTraining: {
      headline: 'Career Training & Workforce Programs in Indiana',
      description:
        'Workforce development and career training programs in Indiana. WIOA-eligible training, apprenticeships, and certification programs serving Indianapolis, Fort Wayne, and Central Indiana. Free for qualifying residents.',
      features: [
        'WIOA-eligible training programs',
        'Registered apprenticeships',
        'Industry certifications',
        'Job placement assistance',
      ],
    },
  },
};

/**
 * Get state configuration by slug
 */
export function getStateConfig(slug: string): StateConfig | undefined {
  return STATES[slug];
}

/**
 * Get all states except the specified one
 */
export function getOtherStates(excludeSlug: string): StateConfig[] {
  return Object.values(STATES).filter((state) => state.slug !== excludeSlug);
}
