/**
 * Adzuna API - Job Search Integration
 * 
 * Usage:
 * import { searchJobs, getTopJobsForTitle, getSalaryInsights } from '@/lib/adzuna';
 */
export {
  searchJobs,
  getTopJobsForTitle,
  getJobsBySocCode,
  getSalaryInsights,
  type JobListing,
  type JobSearchParams,
  type JobSearchResult,
} from './client';
