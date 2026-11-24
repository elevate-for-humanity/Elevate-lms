/**
 * lib/course-builder/workforce-evidence.ts
 *
 * THE single government job-feed loader for the (single) Course Builder.
 *
 * There used to be two ways to get feed data into a course and neither one
 * stored it: the Ultimate workforce adapter loaded O*NET / CareerOneStop /
 * USAJobs only as AI prompt context, and buildCourseEvidenceContext
 * (lib/course-factory/evidence-context.ts) was dead code with no production
 * caller. This module is the one place that loads the job feed — CareerOneStop
 * job postings (/v1/jobsearch), USAJobs federal listings, O*NET occupations,
 * BLS wages/projections — and stores it on the course template as
 * JobFeedEvidence, so a course carries real job data (postings, wages,
 * outlook), not just prompt text.
 *
 * Feeds fail soft, exactly like the feed clients do: a missing key or a
 * failed fetch leaves that section empty and records a warning. The
 * procurement gate (lib/course-factory/procurement-gate.ts) is what fails a
 * credentialed course that has a SOC mapping but no evidence — this loader
 * never blocks a build by itself.
 *
 * JAG (Jobs for America's Graduates) is NOT a feed and is not loaded here.
 * It is a funding/program type carried on the template's `funding` block
 * (see lib/course-builder/schema.ts).
 */
import { getSocCode } from '@/lib/onet/soc-map';
import { buildCourseEvidenceContext } from '@/lib/course-factory/evidence-context';
import {
  loadIndustryStandards,
  type IndustryStandards,
} from '@/lib/industry/standards-loader';
import { fetchCareerOneStopData, isCareerOneStopConfigured } from '@/lib/industry/careeronestop';
import { fetchUsaJobs, type JobRow } from '@/lib/industry/usajobs';
import { logger } from '@/lib/logger';
import { adaptProgramTemplateToBlueprint } from './publish-adapter';
import type { JobFeedEvidence, ProgramBuilderTemplate } from './schema';

/** Resolve the SOC code for a template: explicit field first, then the slug map. */
export function resolveJobFeedSocCode(template: ProgramBuilderTemplate): string | null {
  return template.socCode?.trim() || getSocCode(template.slug) || null;
}

/**
 * Pure mapper: structured feed results -> the JobFeedEvidence stored on a course.
 * Kept pure (no I/O) so the shape is unit-testable without feed keys.
 */
export function buildJobFeedEvidence(args: {
  socCode: string;
  occupationTitle: string;
  standards: IndustryStandards | null;
  evidenceSources: string[];
  usaJobs: JobRow[];
  careerOneStop: { jobPostingsCount: number | null; location: string | null } | null;
  warnings: string[];
}): JobFeedEvidence {
  const { socCode, occupationTitle, standards, evidenceSources, usaJobs, careerOneStop, warnings } = args;
  const sources = Array.from(
    new Set([
      ...evidenceSources,
      ...(standards?.sources ?? []).map((source) =>
        source === 'onet'
          ? 'US-DOL-O*NET'
          : source === 'bls'
            ? 'US-DOL-BLS'
            : source === 'careeronestop'
              ? 'US-DOL-CareerOneStop'
              : source,
      ),
      ...(careerOneStop ? ['US-DOL-CareerOneStop'] : []),
      ...(usaJobs.length ? ['USAJOBS'] : []),
    ]),
  );
  return {
    socCode,
    occupationTitle,
    onet: standards
      ? {
          description: standards.occupation_description,
          tasks: standards.top_tasks,
          skills: standards.top_skills,
          knowledge: standards.top_knowledge,
          technologySkills: standards.technology_skills,
        }
      : null,
    careerOneStop: careerOneStop
      ? {
          jobPostingsCount: careerOneStop.jobPostingsCount,
          location: careerOneStop.location,
          certifications: standards?.certifications ?? [],
        }
      : null,
    usaJobs: {
      count: usaJobs.length,
      listings: usaJobs.slice(0, 10).map((job) => ({
        title: job.title,
        organization: job.organization,
        location: job.location,
        salaryRange: job.salary_range,
        applicationUrl: job.application_url,
      })),
    },
    bls: standards
      ? {
          medianAnnualWage: standards.median_annual_wage,
          entryWage: standards.entry_wage,
          experiencedWage: standards.experienced_wage,
          projectedGrowthPct: standards.projected_growth_pct,
          projectedGrowthCat: standards.projected_growth_cat,
          projectedOpenings: standards.projected_openings,
          typicalEducation: standards.typical_education,
        }
      : null,
    sources,
    fetchedAt: new Date().toISOString(),
    warnings,
  };
}

/**
 * Load the government job feed for a course template and attach it.
 * Returns a new template with `socCode` and `workforceEvidence` set.
 * Never throws for feed failures: a course with no SOC mapping, or with
 * every feed unavailable, comes back with `workforceEvidence: null` and the
 * reasons in the returned warnings (the procurement gate decides whether
 * that blocks publication).
 */
export async function attachJobFeedEvidence(
  template: ProgramBuilderTemplate,
  opts?: { state?: string },
): Promise<{ template: ProgramBuilderTemplate; warnings: string[] }> {
  const warnings: string[] = [];
  const socCode = resolveJobFeedSocCode(template);
  if (!socCode) {
    warnings.push(`No SOC mapping exists for ${template.slug}; job-feed evidence cannot be attached.`);
    return { template: { ...template, socCode: null, workforceEvidence: null }, warnings };
  }

  const occupationTitle = template.title;
  const state = opts?.state ?? template.regulatory?.governingRegion ?? 'IN';

  // Single evidence entry point: the canonical Course Factory evidence
  // builder (RAG + O*NET + CareerOneStop) — this is its production caller.
  // It was dead code before this consolidation.
  let evidenceSources: string[] = [];
  try {
    const blueprint = adaptProgramTemplateToBlueprint(template);
    const evidence = await buildCourseEvidenceContext({
      blueprint,
      programSlug: template.slug,
      state,
    });
    evidenceSources = evidence.sources;
    warnings.push(...evidence.warnings);
  } catch (error) {
    warnings.push(
      `Course Factory evidence unavailable: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  // Cached O*NET + BLS + CareerOneStop standards (30-day Supabase cache).
  let standards: IndustryStandards | null = null;
  try {
    standards = await loadIndustryStandards(socCode);
    if (!standards) warnings.push('No O*NET/BLS/CareerOneStop standards returned for this SOC code.');
  } catch (error) {
    warnings.push(
      `Industry standards unavailable: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  // USAJobs federal listings. Returns [] when keys are missing.
  let usaJobs: JobRow[] = [];
  try {
    usaJobs = await fetchUsaJobs(occupationTitle, state === 'IN' ? 'Indiana' : '', 10);
  } catch (error) {
    warnings.push(`USAJobs feed unavailable: ${error instanceof Error ? error.message : String(error)}`);
  }

  // CareerOneStop job postings count (/v1/jobsearch) — the live job-demand
  // number for this SOC code. Only the count is available on this account.
  let careerOneStop: { jobPostingsCount: number | null; location: string | null } | null = null;
  if (isCareerOneStopConfigured()) {
    try {
      const demand = await fetchCareerOneStopData(socCode, occupationTitle, state);
      careerOneStop = { jobPostingsCount: demand.job_postings_count, location: demand.location };
      evidenceSources.push('US-DOL-CareerOneStop');
    } catch (error) {
      warnings.push(
        `CareerOneStop job postings unavailable: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  } else {
    warnings.push('CareerOneStop credentials are not configured');
  }

  const evidence = buildJobFeedEvidence({
    socCode,
    occupationTitle,
    standards,
    evidenceSources,
    usaJobs,
    careerOneStop,
    warnings,
  });

  if (evidence.sources.length === 0) {
    warnings.push('No government job-feed source returned data for this course.');
    logger.warn('[course-builder/workforce-evidence] No job-feed evidence attached', {
      programSlug: template.slug,
      socCode,
      warnings,
    });
    return { template: { ...template, socCode, workforceEvidence: null }, warnings };
  }

  return { template: { ...template, socCode, workforceEvidence: evidence }, warnings };
}
