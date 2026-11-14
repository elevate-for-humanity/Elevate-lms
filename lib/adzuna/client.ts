/**
 * Adzuna Job Search API v1 — server-side only.
 *
 * Base URL: https://api.adzuna.com/v1/api/jobs
 * Auth: app_id + app_key query params (set via env vars)
 * Docs: https://developer.adzuna.com/
 *
 * Environment Variables:
 *   ADZUNA_APP_ID  - Your Adzuna Application ID
 *   ADZUNA_APP_KEY - Your Adzuna Application Key
 *   ADZUNA_COUNTRY - Country code (default: us)
 */
import 'server-only';
import { logger } from '@/lib/logger';

const BASE = 'https://api.adzuna.com/v1/api/jobs';
const COUNTRY = process.env.ADZUNA_COUNTRY ?? 'us';
const APP_ID = process.env.ADZUNA_APP_ID ?? '';
const APP_KEY = process.env.ADZUNA_APP_KEY ?? '';

// Cache TTL: 15 minutes (job data changes frequently)
const REVALIDATE = 60 * 15;

interface AdzunaJob {
  id: string;
  title: string;
  description: string;
  company: { display_name: string };
  location: { display_name: string };
  salary_min?: number;
  salary_max?: number;
  salary_is_predicted?: number;
  contract_time?: string;
  contract_type?: string;
  category?: { label: string };
  created: string;
  redirect_url: string;
}

interface AdzunaSearchResult {
  results: AdzunaJob[];
  count: number;
  mean_salary?: number;
  min_salary?: number;
  max_salary?: number;
}

function buildHeaders() {
  return {
    'Content-Type': 'application/json',
  };
}

async function adzunaFetch<T>(path: string): Promise<T | null> {
  if (!APP_ID || !APP_KEY) {
    logger.warn('[adzuna] ADZUNA_APP_ID or ADZUNA_APP_KEY not set — skipping fetch');
    return null;
  }

  try {
    const url = `${BASE}/${COUNTRY}${path}&app_id=${APP_ID}&app_key=${APP_KEY}`;
    const res = await fetch(url, {
      headers: buildHeaders(),
      next: { revalidate: REVALIDATE },
    });

    if (!res.ok) {
      logger.warn(`[adzuna] ${path} → ${res.status}`);
      return null;
    }

    return res.json() as Promise<T>;
  } catch (err) {
    logger.error('[adzuna] fetch error', undefined, { path, err });
    return null;
  }
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface JobListing {
  id: string;
  title: string;
  description: string;
  company: string;
  location: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryPredicted?: boolean;
  contractTime?: string;
  contractType?: string;
  category?: string;
  postedDate: string;
  applyUrl: string;
}

export interface JobSearchParams {
  what?: string;
  what_and?: string;
  what_phrase?: string;
  where?: string;
  distance?: number;
  salary_min?: number;
  salary_max?: number;
  contract_time?: string;
  sort_by?: 'date' | 'salary';
  results_per_page?: number;
}

export interface JobSearchResult {
  jobs: JobListing[];
  totalCount: number;
  meanSalary?: number;
  minSalary?: number;
  maxSalary?: number;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Search jobs by keyword and location.
 * Used for student career matching and job board.
 */
export async function searchJobs(params: JobSearchParams): Promise<JobSearchResult> {
  const {
    what,
    what_and,
    what_phrase,
    where,
    distance = 10,
    salary_min,
    salary_max,
    contract_time,
    sort_by,
    results_per_page = 20,
  } = params;

  const parts: string[] = [];

  if (what) parts.push(`what=${encodeURIComponent(what)}`);
  if (what_and) parts.push(`what_and=${encodeURIComponent(what_and)}`);
  if (what_phrase) parts.push(`what_phrase=${encodeURIComponent(what_phrase)}`);
  if (where) parts.push(`where=${encodeURIComponent(where)}`);
  if (distance) parts.push(`distance=${distance}`);
  if (salary_min) parts.push(`salary_min=${salary_min}`);
  if (salary_max) parts.push(`salary_max=${salary_max}`);
  if (contract_time) parts.push(`contract_time=${contract_time}`);
  if (sort_by) parts.push(`sort_by=${sort_by}`);
  parts.push(`results_per_page=${Math.min(results_per_page, 100)}`);

  const path = `/search/1?${parts.join('&')}`;

  const data = await adzunaFetch<AdzunaSearchResult>(path);

  if (!data) {
    return { jobs: [], totalCount: 0 };
  }

  return {
    jobs: data.results.map(mapJob),
    totalCount: data.count ?? 0,
    meanSalary: data.mean_salary,
    minSalary: data.min_salary,
    maxSalary: data.max_salary,
  };
}

/**
 * Get top jobs for a specific job title.
 * Used for career pages and program outcomes.
 */
export async function getTopJobsForTitle(
  title: string,
  location?: string,
  limit = 10,
): Promise<JobListing[]> {
  const path = `/search/1?what=${encodeURIComponent(title)}${location ? `&where=${encodeURIComponent(location)}` : ''}&results_per_page=${limit}&sort_by=relevance`;

  const data = await adzunaFetch<AdzunaSearchResult>(path);

  if (!data) return [];

  return data.results.map(mapJob);
}

/**
 * Get jobs by SOC code category.
 * Used for program-specific job matching.
 */
export async function getJobsBySocCode(socCode: string, location?: string, limit = 20): Promise<JobListing[]> {
  const path = `/search/1?what=${encodeURIComponent(socCode)}${location ? `&where=${encodeURIComponent(location)}` : ''}&results_per_page=${limit}`;

  const data = await adzunaFetch<AdzunaSearchResult>(path);

  if (!data) return [];

  return data.results.map(mapJob);
}

/**
 * Get salary insights for a job title.
 * Used for career outcome pages.
 */
export async function getSalaryInsights(title: string, location?: string): Promise<{
  meanSalary?: number;
  minSalary?: number;
  maxSalary?: number;
} | null> {
  const path = `/search/1?what=${encodeURIComponent(title)}${location ? `&where=${encodeURIComponent(location)}` : ''}&results_per_page=100`;

  const data = await adzunaFetch<AdzunaSearchResult>(path);

  if (!data) return null;

  return {
    meanSalary: data.mean_salary,
    minSalary: data.min_salary,
    maxSalary: data.max_salary,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function mapJob(job: AdzunaJob): JobListing {
  return {
    id: job.id,
    title: job.title,
    description: stripHtml(job.description),
    company: job.company?.display_name ?? 'Company not listed',
    location: job.location?.display_name ?? 'Location not specified',
    salaryMin: job.salary_min,
    salaryMax: job.salary_max,
    salaryPredicted: job.salary_is_predicted === 1,
    contractTime: job.contract_time,
    contractType: job.contract_type,
    category: job.category?.label,
    postedDate: job.created,
    applyUrl: job.redirect_url,
  };
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500);
}

/**
 * Attribution text required for Adzuna API usage.
 * Display this on any page showing Adzuna job data.
 */
export const ADZUNA_ATTRIBUTION = 'Jobs sourced by Adzuna';
