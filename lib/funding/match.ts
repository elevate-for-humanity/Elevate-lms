import { FUNDING_PROGRAMS, FundingProgram } from './catalog';

export function matchFundingPrograms(params: {
  programTitle: string;
  cipCode?: string | null;
  targetPopulation?: string[];
  hasApprenticeship?: boolean;
  sector?: string;
}): FundingProgram[] {
  const tags: string[] = [];

  // Add population tags
  if (params.targetPopulation?.includes('youth')) tags.push('youth');
  if (params.targetPopulation?.includes('adult')) tags.push('adult');
  if (params.targetPopulation?.includes('reentry'))
    tags.push('reentry', 'barriers', 'justice-involved');
  if (params.targetPopulation?.includes('low-income')) tags.push('low-income', 'snap', 'tanf');
  if (params.targetPopulation?.includes('dislocated')) tags.push('dislocated', 'laid-off');

  // Add apprenticeship tag
  if (params.hasApprenticeship) tags.push('apprenticeship');

  // Analyze program title for keywords
  const title = params.programTitle.toLowerCase();

  // Sector-specific tags
  if (title.includes('barber') || title.includes('cosmetology') || title.includes('beauty')) {
    tags.push('apprenticeship', 'cte');
  }

  if (
    title.includes('hvac') ||
    title.includes('construction') ||
    title.includes('electrician') ||
    title.includes('plumbing')
  ) {
    tags.push('construction', 'apprenticeship', 'cte');
  }

  if (
    title.includes('medical') ||
    title.includes('healthcare') ||
    title.includes('nursing') ||
    title.includes('assistant') ||
    title.includes('cna') ||
    title.includes('phlebotomy')
  ) {
    tags.push('healthcare', 'workforce', 'cte');
  }

  if (
    title.includes('it') ||
    title.includes('technology') ||
    title.includes('computer') ||
    title.includes('software') ||
    title.includes('cybersecurity')
  ) {
    tags.push('workforce', 'cte', 'high-skill');
  }

  if (title.includes('manufacturing') || title.includes('welding') || title.includes('machining')) {
    tags.push('manufacturing', 'apprenticeship', 'cte', 'trade');
  }

  if (
    title.includes('culinary') ||
    title.includes('hospitality') ||
    title.includes('food service')
  ) {
    tags.push('workforce', 'cte');
  }

  // Add general workforce tags
  tags.push('workforce', 'training');

  // Remove duplicates
  const uniqueTags = Array.from(new Set(tags));

  // Score each funding program based on tag overlap
  const scored = FUNDING_PROGRAMS.map((fp) => {
    const overlap = fp.tags.filter((t) => uniqueTags.includes(t)).length;
    return { fp, score: overlap };
  });

  // Return programs with at least one matching tag, sorted by score
  return scored
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.fp);
}

export function getFundingProgramById(id: string): FundingProgram | undefined {
  return FUNDING_PROGRAMS.find((fp) => fp.id === id);
}

export function getAllFundingPrograms(): FundingProgram[] {
  return FUNDING_PROGRAMS;
}
