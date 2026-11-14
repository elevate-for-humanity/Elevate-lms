/**
 * Career Intelligence Dashboard - Combines all job/career data sources
 * 
 * Integrates:
 * - Adzuna: Real-time job listings
 * - O*NET: Career data, skills, tasks
 * - USAJOBS: Federal job listings
 * - CareerOneStop: Training programs
 */
import { getSalaryInsights, searchJobs, type JobListing } from '@/lib/adzuna';
import { searchOnetOccupations, getOnetSnapshot } from '@/lib/onet/client';

export interface CareerDashboardData {
  jobListings: JobListing[];
  totalJobs: number;
  salaryInsights: {
    meanSalary?: number;
    minSalary?: number;
    maxSalary?: number;
  } | null;
  relatedOccupations: {
    code: string;
    title: string;
    description: string;
  }[];
  jobDemand: 'high' | 'medium' | 'low';
}

export interface ProgramCareerData {
  programTitle: string;
  socCode: string;
  jobTitle: string;
  dashboard: CareerDashboardData;
}

/**
 * Get comprehensive career intelligence for a program
 */
export async function getProgramCareerIntelligence(
  programTitle: string,
  jobTitle: string,
  socCode?: string,
  location?: string
): Promise<ProgramCareerData> {
  // Fetch data in parallel
  const [salaryInsights, adzunaJobs, relatedOccupations] = await Promise.all([
    getSalaryInsights(jobTitle, location).catch(() => null),
    searchJobs({
      what: jobTitle,
      where: location ?? 'Indianapolis',
      results_per_page: 10,
    }),
    socCode 
      ? searchOnetOccupations(jobTitle).catch(() => [])
      : Promise.resolve([]),
  ]);

  // Determine job demand based on listing count
  let jobDemand: 'high' | 'medium' | 'low' = 'medium';
  if (adzunaJobs.totalCount > 100) jobDemand = 'high';
  else if (adzunaJobs.totalCount < 20) jobDemand = 'low';

  return {
    programTitle,
    socCode: socCode ?? 'Unknown',
    jobTitle,
    dashboard: {
      jobListings: adzunaJobs.jobs,
      totalJobs: adzunaJobs.totalCount,
      salaryInsights: salaryInsights
        ? { ...salaryInsights }
        : { meanSalary: adzunaJobs.meanSalary, minSalary: adzunaJobs.minSalary, maxSalary: adzunaJobs.maxSalary },
      relatedOccupations: relatedOccupations.slice(0, 5).map(o => ({
        code: o.code,
        title: o.title,
        description: o.description,
      })),
      jobDemand,
    },
  };
}

/**
 * Format salary for display
 */
export function formatSalaryRange(salary: { meanSalary?: number; minSalary?: number; maxSalary?: number } | null): string {
  if (!salary) return 'Data not available';
  
  const { meanSalary, minSalary, maxSalary } = salary;
  
  if (meanSalary) {
    return `$${(meanSalary / 1000).toFixed(0)}k average`;
  }
  if (minSalary && maxSalary) {
    return `$${(minSalary / 1000).toFixed(0)}k - $${(maxSalary / 1000).toFixed(0)}k`;
  }
  if (minSalary) {
    return `From $${(minSalary / 1000).toFixed(0)}k`;
  }
  return 'Data not available';
}

/**
 * Get job demand label with color
 */
export function getJobDemandInfo(demand: 'high' | 'medium' | 'low'): { label: string; color: string } {
  switch (demand) {
    case 'high':
      return { label: 'High Demand', color: 'text-emerald-600 bg-emerald-100' };
    case 'medium':
      return { label: 'Moderate Demand', color: 'text-amber-600 bg-amber-100' };
    case 'low':
      return { label: 'Low Demand', color: 'text-red-600 bg-red-100' };
  }
}
