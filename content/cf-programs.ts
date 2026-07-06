/**
 * Legacy CF Programs data - fallback for program pages
 * @deprecated Use @/data/programs instead
 */

export interface CfProgram {
  slug: string;
  title: string;
  summary: string;
  description: string;
  category?: string;
}

export const programs: CfProgram[] = [];
