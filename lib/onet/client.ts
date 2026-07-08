/**
 * O*NET Web Services v2 client — server-side only.
 *
 * Base URL: https://api-v2.onetcenter.org
 * Auth: X-API-Key header (set ONET_API_KEY env var)
 * License: Data must credit O*NET Web Services / USDOL/ETA.
 *
 * https://services.onetcenter.org/developer/
 */
import 'server-only';
import { logger } from '@/lib/logger';

const BASE = 'https://api-v2.onetcenter.org';
const KEY = process.env.ONET_API_KEY ?? '';

// Cache TTL: 7 days (O*NET data updates quarterly)
const REVALIDATE = 60 * 60 * 24 * 7;

async function onetFetch<T>(path: string): Promise<T | null> {
  if (!KEY) {
    logger.warn('[onet] ONET_API_KEY not set — skipping fetch');
    return null;
  }
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: {
        'X-API-Key': KEY,
        Accept: 'application/json',
      },
      next: { revalidate: REVALIDATE },
    });
    if (!res.ok) {
      logger.warn(`[onet] ${path} → ${res.status}`);
      return null;
    }
    return res.json() as Promise<T>;
  } catch (err) {
    logger.error('[onet] fetch error', undefined, { path, err });
    return null;
  }
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface OnetOccupation {
  code: string;
  title: string;
  description: string;
  tags?: { bright_outlook?: boolean; green?: boolean };
  bright_outlook?: { code: string; title: string }[];
  sample_of_reported_titles?: string[];
}

export interface OnetJobZone {
  code: number;
  title: string;
  education: string;
  related_experience: string;
  job_training: string;
  job_zone_examples: string;
  svp_range: string;
}

export interface OnetSkills {
  element: {
    id: string;
    name: string;
    score: { value: number; important: boolean };
  }[];
}

export interface OnetKnowledge {
  element: {
    id: string;
    name: string;
    score: { value: number; important: boolean };
  }[];
}

export interface OnetTasks {
  task: { id: string; statement: string; importance?: number }[];
}

export interface OnetRelatedOccupations {
  occupation: { href: string; code: string; title: string }[];
}

export interface OnetApprenticeships {
  apprenticeship?: {
    rapids_code?: string;
    title?: string;
    url?: string;
  }[];
}

/** Aggregated labor market snapshot for a single SOC code */
export interface OnetLaborSnapshot {
  soc: string;
  title: string;
  description: string;
  brightOutlook: boolean;
  brightOutlookReasons: string[];
  jobZone: number;
  jobZoneTitle: string;
  jobZoneEducation: string;
  topSkills: string[];
  topKnowledge: string[];
  coreTasks: string[];
  sampleTitles: string[];
  hasApprenticeships: boolean;
  relatedOccupations: { code: string; title: string }[];
  /** Attribution required by O*NET license */
  attribution: string;
}

// ── Public API ───────────────────────────────────────────────────────────────

/** Fetch full labor market snapshot for a SOC code. Returns null if API unavailable. */
export async function getOnetSnapshot(soc: string): Promise<OnetLaborSnapshot | null> {
  const [occupation, jobZone, skills, knowledge, tasks, apprenticeships, related] =
    await Promise.all([
      onetFetch<OnetOccupation>(`/online/occupations/${soc}`),
      onetFetch<OnetJobZone>(`/online/occupations/${soc}/summary/job_zone`),
      onetFetch<OnetSkills>(`/online/occupations/${soc}/summary/skills`),
      onetFetch<OnetKnowledge>(`/online/occupations/${soc}/summary/knowledge`),
      onetFetch<OnetTasks>(`/online/occupations/${soc}/summary/tasks`),
      onetFetch<OnetApprenticeships>(`/online/occupations/${soc}/summary/apprenticeship`),
      onetFetch<OnetRelatedOccupations>(`/online/occupations/${soc}/summary/related_occupations`),
    ]);

  if (!occupation) return null;

  return {
    soc,
    title: occupation.title,
    description: occupation.description,
    brightOutlook: occupation.tags?.bright_outlook ?? false,
    brightOutlookReasons: occupation.bright_outlook?.map((r) => r.title) ?? [],
    jobZone: jobZone?.code ?? 0,
    jobZoneTitle: jobZone?.title ?? '',
    jobZoneEducation: jobZone?.education ?? '',
    topSkills:
      skills?.element
        ?.filter((e) => e.score.important)
        .slice(0, 8)
        .map((e) => e.name) ?? [],
    topKnowledge:
      knowledge?.element
        ?.filter((e) => e.score.important)
        .slice(0, 6)
        .map((e) => e.name) ?? [],
    coreTasks: tasks?.task?.slice(0, 6).map((t) => t.statement) ?? [],
    sampleTitles: occupation.sample_of_reported_titles?.slice(0, 6) ?? [],
    hasApprenticeships: (apprenticeships?.apprenticeship?.length ?? 0) > 0,
    relatedOccupations:
      related?.occupation?.slice(0, 4).map((o) => ({ code: o.code, title: o.title })) ?? [],
    attribution:
      'O*NET OnLine by the U.S. Department of Labor, Employment and Training Administration (USDOL/ETA). O*NET® is a trademark of USDOL/ETA.',
  };
}

/** Search O*NET occupations by keyword. Used for LMS course builder. */
export async function searchOnetOccupations(
  keyword: string,
  limit = 10,
): Promise<{ code: string; title: string }[]> {
  const data = await onetFetch<{
    career: { code: string; title: string }[];
  }>(`/mnm/search?keyword=${encodeURIComponent(keyword)}&end=${limit}`);
  return data?.career ?? [];
}
