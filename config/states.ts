// State configuration for SEO pages
// Single source of truth for state-specific content

export interface StateConfig {
  slug: string;
  name: string;
  abbreviation: string;
  demonym: string;
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
        'Workforce development and career training programs in Indiana, including funded training pathways, apprenticeships, and certification preparation. Funding eligibility varies by participant and program.',
      features: [
        'Workforce-funded training pathways',
        'Registered apprenticeships',
        'Industry certification preparation',
        'Career and placement support',
      ],
    },
    communityServices: {
      headline: 'Workforce & Community Services in Indiana',
      description:
        'Career navigation, testing, apprenticeship support, employer connections, and community workforce services coordinated through Elevate for Humanity and participating partners.',
    },
  },
};

export function getStateConfig(slug: string): StateConfig | undefined {
  return STATES[slug];
}

export function getOtherStates(excludeSlug: string): StateConfig[] {
  return Object.values(STATES).filter((state) => state.slug !== excludeSlug);
}
