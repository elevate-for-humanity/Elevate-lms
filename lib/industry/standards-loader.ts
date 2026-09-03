/**
 * lib/industry/standards-loader.ts
 *
 * Orchestrates fetching, caching, and returning industry standards
 * for a given SOC code. This is the single entry point for all
 * industry data used in AI course generation.
 *
 * Flow:
 *   1. Check Supabase cache (occupation_standards + credential_domains)
 *   2. If fresh (< 30 days), return cached data
 *   3. If stale or missing, fetch from O*NET + BLS + CareerOneStop
 *   4. Write to Supabase cache
 *   5. Return structured IndustryStandards object
 *
 * The returned object is passed directly to buildIndustryAwarePrompt()
 * which injects it into the AI system prompt.
 */

import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { fetchOnetOccupation, isOnetConfigured, type OnetOccupation } from './onet';
import {
  fetchBlsWages,
  fetchBlsProjections,
  type BlsWageData,
  type BlsProjectionData,
} from './bls';
import {
  fetchCareerOneStopData,
  isCareerOneStopConfigured,
  type CareerOneStopData,
} from './careeronestop';

export interface CredentialDomain {
  key: string;
  name: string;
  weight_pct: number;
  min_hours: number;
  competencies: string[];
}

export interface IndustryStandards {
  soc_code: string;
  occupation_title: string;
  occupation_description: string;

  // Top job tasks (importance-ranked, core only)
  top_tasks: string[];

  // Top skills required
  top_skills: string[];

  // Top knowledge areas
  top_knowledge: string[];

  // Wage context
  median_annual_wage: number | null;
  entry_wage: number | null;
  experienced_wage: number | null;
  indiana_median_wage: number | null;

  // Employment outlook
  projected_growth_pct: number | null;
  projected_growth_cat: string | null;
  projected_openings: number | null;
  typical_education: string | null;

  // Certifications available
  certifications: { name: string; organization: string }[];

  // Credentialing body domains (IC&RC, NHA, EPA, etc.)
  credential_domains: CredentialDomain[];
  credential_code: string | null;
  exam_blueprint: any | null;

  // Technology tools used in this occupation
  technology_skills: string[];

  // Source freshness
  fetched_at: string;
  sources: string[];
  is_cached: boolean;
}

/**
 * Load industry standards for a SOC code.
 * Returns cached data if fresh, fetches live if stale/missing.
 *
 * @param socCode       e.g. '21-1093.00'
 * @param credentialCode  e.g. 'ICRC-PRS' — if provided, loads credential domains
 * @param forceRefresh  bypass cache and fetch live
 */
export async function loadIndustryStandards(
  socCode: string,
  credentialCode?: string | null,
  forceRefresh = false,
): Promise<IndustryStandards | null> {
  const db = await requireAdminClient();

  // 1. Check cache
  if (!forceRefresh) {
    const cached = await loadFromCache(db, socCode, credentialCode);
    if (cached) return cached;
  }

  // 2. Fetch live data
  const sources: string[] = [];
  let onet: OnetOccupation | null = null;
  let wages: BlsWageData | null = null;
  let projections: BlsProjectionData | null = null;
  let cos: CareerOneStopData | null = null;

  if (isOnetConfigured()) {
    try {
      onet = await fetchOnetOccupation(socCode);
      sources.push('onet');
    } catch (err) {
      logger.error('[standards-loader] O*NET fetch failed:', err);
    }
  }

  try {
    wages = await fetchBlsWages(socCode);
    projections = await fetchBlsProjections(socCode);
    sources.push('bls');
  } catch (err) {
    logger.error('[standards-loader] BLS fetch failed:', err);
  }

  if (isCareerOneStopConfigured() && onet?.title) {
    try {
      cos = await fetchCareerOneStopData(socCode, onet.title);
      sources.push('careeronestop');
    } catch (err) {
      logger.error('[standards-loader] CareerOneStop fetch failed:', err);
    }
  }

  // 3. Load credential domains from DB
  const { data: domainRow } = credentialCode
    ? await db
        .from('credential_domains')
        .select('*')
        .eq('credential_code', credentialCode)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };

  // 4. Write to cache
  if (onet || wages) {
    await writeToCache(db, socCode, onet, wages, projections, cos);
  }

  // 5. Build and return
  if (!onet && !wages) return null;

  return buildStandards(socCode, onet, wages, projections, cos, domainRow, sources);
}

async function loadFromCache(
  db: any,
  socCode: string,
  credentialCode?: string | null,
): Promise<IndustryStandards | null> {
  const { data: rows } = await db
    .from('occupation_standards')
    .select('*')
    .eq('soc_code', socCode)
    .gt('expires_at', new Date().toISOString());

  if (!rows || rows.length === 0) return null;

  const onetRow = rows.find((r: any) => r.source === 'onet');
  const blsRow = rows.find((r: any) => r.source === 'bls');
  const cosRow = rows.find((r: any) => r.source === 'careeronestop');

  if (!onetRow && !blsRow) return null;

  const { data: domainRow } = credentialCode
    ? await db
        .from('credential_domains')
        .select('*')
        .eq('credential_code', credentialCode)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };

  const onet = onetRow ? rowToOnet(onetRow) : null;
  const wages = blsRow ? rowToWages(blsRow, socCode) : null;
  const projections = blsRow ? rowToProjections(blsRow, socCode) : null;
  const cos = cosRow ? rowToCos(cosRow, socCode) : null;

  return buildStandards(
    socCode,
    onet,
    wages,
    projections,
    cos,
    domainRow,
    [onetRow && 'onet', blsRow && 'bls', cosRow && 'careeronestop'].filter(Boolean) as string[],
    true,
  );
}

async function writeToCache(
  db: any,
  socCode: string,
  onet: OnetOccupation | null,
  wages: BlsWageData | null,
  projections: BlsProjectionData | null,
  cos: CareerOneStopData | null,
) {
  const now = new Date().toISOString();
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  if (onet) {
    await db.from('occupation_standards').upsert(
      {
        soc_code: socCode,
        soc_title: onet.title,
        source: 'onet',
        tasks: onet.tasks,
        skills: onet.skills,
        knowledge: onet.knowledge,
        abilities: onet.abilities,
        work_activities: onet.work_activities,
        technology_skills: onet.technology_skills,
        education_required: onet.education,
        fetched_at: now,
        expires_at: expires,
      },
      { onConflict: 'soc_code,source' },
    );
  }

  if (wages || projections) {
    await db.from('occupation_standards').upsert(
      {
        soc_code: socCode,
        soc_title: onet?.title ?? socCode,
        source: 'bls',
        median_annual_wage: wages?.median_annual_wage ?? projections?.median_annual_wage ?? null,
        entry_wage: wages?.entry_wage ?? null,
        experienced_wage: wages?.experienced_wage ?? null,
        employment_count: projections?.employment_2032 ?? null,
        projected_growth_pct: projections?.projected_growth_pct ?? null,
        projected_growth_cat: projections?.projected_growth_cat ?? null,
        fetched_at: now,
        expires_at: expires,
      },
      { onConflict: 'soc_code,source' },
    );
  }

  if (cos) {
    await db.from('occupation_standards').upsert(
      {
        soc_code: socCode,
        soc_title: onet?.title ?? socCode,
        source: 'careeronestop',
        certifications: cos.certifications,
        apprenticeship_count: cos.apprenticeship_count,
        job_postings_count: cos.job_postings_count,
        indiana_median_wage: cos.local_median_wage,
        top_employers: cos.top_employers,
        fetched_at: now,
        expires_at: expires,
      },
      { onConflict: 'soc_code,source' },
    );
  }
}

function buildStandards(
  socCode: string,
  onet: OnetOccupation | null,
  wages: BlsWageData | null,
  projections: BlsProjectionData | null,
  cos: CareerOneStopData | null,
  domainRow: any | null,
  sources: string[],
  isCached = false,
): IndustryStandards {
  // Top tasks: core tasks sorted by importance, top 15
  const topTasks = (onet?.tasks ?? [])
    .filter((t) => t.task_type === 'core')
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 15)
    .map((t) => t.task);

  // Top skills: sorted by importance, top 12
  const topSkills = (onet?.skills ?? [])
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 12)
    .map((s) => s.name);

  // Top knowledge: sorted by importance, top 8
  const topKnowledge = (onet?.knowledge ?? [])
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 8)
    .map((k) => k.name);

  // Technology skills: hot technologies first
  const techSkills = (onet?.technology_skills ?? [])
    .sort((a, b) => (b.hot_technology ? 1 : 0) - (a.hot_technology ? 1 : 0))
    .slice(0, 10)
    .map((t) => t.name);

  const domains: CredentialDomain[] = domainRow?.domains ?? [];
  const examBlueprint = domainRow?.exam_blueprint ?? null;

  return {
    soc_code: socCode,
    occupation_title: onet?.title ?? '',
    occupation_description: onet?.description ?? '',
    top_tasks: topTasks,
    top_skills: topSkills,
    top_knowledge: topKnowledge,
    median_annual_wage: wages?.median_annual_wage ?? projections?.median_annual_wage ?? null,
    entry_wage: wages?.entry_wage ?? null,
    experienced_wage: wages?.experienced_wage ?? null,
    indiana_median_wage: cos?.local_median_wage ?? null,
    projected_growth_pct: projections?.projected_growth_pct ?? null,
    projected_growth_cat: projections?.projected_growth_cat ?? null,
    projected_openings: projections?.projected_openings ?? null,
    typical_education: projections?.typical_education ?? onet?.education?.typical_level ?? null,
    certifications: cos?.certifications ?? [],
    credential_domains: domains,
    credential_code: domainRow?.credential_code ?? null,
    exam_blueprint: examBlueprint,
    technology_skills: techSkills,
    fetched_at: new Date().toISOString(),
    sources,
    is_cached: isCached,
  };
}

// ── Cache row → typed objects ─────────────────────────────────────────────────

function rowToOnet(row: any): OnetOccupation {
  return {
    soc_code: row.soc_code,
    title: row.soc_title,
    description: '',
    tasks: row.tasks ?? [],
    skills: row.skills ?? [],
    knowledge: row.knowledge ?? [],
    abilities: row.abilities ?? [],
    work_activities: row.work_activities ?? [],
    technology_skills: row.technology_skills ?? [],
    education: row.education_required ?? { typical_level: '', distribution: [] },
  };
}

function rowToWages(row: any, socCode: string): BlsWageData {
  return {
    soc_code: socCode,
    median_annual_wage: row.median_annual_wage,
    entry_wage: row.entry_wage,
    experienced_wage: row.experienced_wage,
    employment_count: row.employment_count,
    year: 2024,
  };
}

function rowToProjections(row: any, socCode: string): BlsProjectionData {
  return {
    soc_code: socCode,
    employment_2022: null,
    employment_2032: row.employment_count,
    projected_growth_pct: row.projected_growth_pct,
    projected_growth_cat: row.projected_growth_cat,
    projected_openings: null,
    median_annual_wage: row.median_annual_wage,
    typical_education: null,
  };
}

function rowToCos(row: any, socCode: string): CareerOneStopData {
  return {
    soc_code: socCode,
    location: 'IN',
    certifications: row.certifications ?? [],
    apprenticeship_count: row.apprenticeship_count ?? 0,
    job_postings_count: row.job_postings_count ?? 0,
    local_median_wage: row.indiana_median_wage,
    top_employers: row.top_employers ?? [],
  };
}
