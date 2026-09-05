export const HVAC_EMPLOYER_REGIONS = [
  { slug: 'indianapolis', city: 'Indianapolis', county: 'Marion County' },
  { slug: 'fort-wayne', city: 'Fort Wayne', county: 'Allen County' },
  { slug: 'south-bend', city: 'South Bend', county: 'St. Joseph County' },
  { slug: 'evansville', city: 'Evansville', county: 'Vanderburgh County' },
] as const;

export type HvacEmployerRegion = (typeof HVAC_EMPLOYER_REGIONS)[number];

export function getHvacEmployerRegion(slug: string) {
  return HVAC_EMPLOYER_REGIONS.find((region) => region.slug === slug);
}
