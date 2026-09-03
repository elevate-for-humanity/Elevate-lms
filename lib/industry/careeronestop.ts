/**
 * lib/industry/careeronestop.ts
 *
 * CareerOneStop API client (US DOL).
 *
 * Credentials: careeronestop.org/Developers — expires 2029-04-25
 * Set CAREERONESTOP_USER_ID and CAREERONESTOP_API_KEY in environment.
 *
 * Confirmed working endpoints (tested 2026-04-25):
 *   GET /v1/jobsearch/{userId}/{socCode}/{state}/{radius}/{top}
 *   GET /v1/occupation/{userId}/{keyword}/{state}/{radius}/{top}
 *
 * Not available on this account (return 404):
 *   /v1/wages, /v1/certificationfinder, /v1/apprenticeship
 *
 * Use BLS OES for wages. Job count from jobsearch is the primary value here.
 */

const BASE = 'https://api.careeronestop.org/v1';

export interface CareerOneStopCertification {
  name: string;
  organization: string;
  url: string;
}

export interface CareerOneStopData {
  soc_code: string;
  location: string;
  certifications: CareerOneStopCertification[];
  apprenticeship_count: number;
  job_postings_count: number;
  local_median_wage: number | null;
  top_employers: { name: string; location: string }[];
}

function authHeaders(): HeadersInit {
  const apiKey = process.env.CAREERONESTOP_API_KEY;
  if (!apiKey) throw new Error('CAREERONESTOP_API_KEY must be set');
  return { Authorization: `Bearer ${apiKey}` };
}

function userId(): string {
  const id = process.env.CAREERONESTOP_USER_ID;
  if (!id) throw new Error('CAREERONESTOP_USER_ID must be set');
  return id;
}

async function cosGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}/${userId()}${path}`, {
    headers: authHeaders(),
    signal: AbortSignal.timeout(15_000),
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`CareerOneStop ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

/**
 * Fetch Indiana job postings count for a SOC code.
 * Uses /v1/jobsearch — confirmed working.
 */
async function fetchJobPostings(socCode: string, state: string): Promise<number> {
  try {
    const data = await cosGet<any>(`/jobsearch/${encodeURIComponent(socCode)}/${state}/0/10`);
    const count = parseInt(data?.Jobcount ?? data?.TotalJobsFound ?? '0', 10);
    return isNaN(count) ? 0 : count;
  } catch {
    return 0;
  }
}

/**
 * Fetch all CareerOneStop data for an occupation.
 * Only job postings count is available on this account tier.
 * Wages come from BLS; certifications/apprenticeships are not available.
 */
export async function fetchCareerOneStopData(
  socCode: string,
  title: string,
  state: string = 'IN',
): Promise<CareerOneStopData> {
  const jobPostings = await fetchJobPostings(socCode, state).catch(() => 0);

  return {
    soc_code: socCode,
    location: state,
    certifications: [], // /certificationfinder not available on this account
    apprenticeship_count: 0, // /apprenticeship not available on this account
    job_postings_count: jobPostings,
    local_median_wage: null, // use BLS OES wages instead
    top_employers: [],
  };
}

export function isCareerOneStopConfigured(): boolean {
  return !!(process.env.CAREERONESTOP_USER_ID && process.env.CAREERONESTOP_API_KEY);
}
