/**
 * Canonical evidence ingestion for Course Factory.
 *
 * Every AI-authored course must be grounded in registered credential/blueprint
 * requirements and, when an SOC mapping is available, current federal
 * occupational evidence. Authoring surfaces must not call the feeds directly.
 */
import type { CredentialBlueprint, BlueprintModule } from './types';
import { getSocCode } from '@/lib/onet/soc-map';
import { fetchOnetOccupation, isOnetConfigured } from '@/lib/industry/onet';
import { fetchCareerOneStopData, isCareerOneStopConfigured } from '@/lib/industry/careeronestop';
import { logger } from '@/lib/logger';
import { getRAGContext } from '@/lib/platform/rag';

export type CourseEvidenceContext = {
  standardsBlock: string;
  sources: string[];
  socCode: string | null;
  grounded: boolean;
  warnings: string[];
};

function moduleEvidence(module: BlueprintModule) {
  const competencies = (module.competencies ?? []).map((entry: any) =>
    [entry.competencyKey, entry.title, entry.description].filter(Boolean).join(': '),
  );
  return [
    `Module domain: ${module.domainKey ?? module.title}`,
    ...competencies.map((item) => `Required competency: ${item}`),
  ];
}

export async function buildCourseEvidenceContext(args: {
  blueprint: CredentialBlueprint;
  programSlug?: string | null;
  state?: string | null;
}): Promise<CourseEvidenceContext> {
  const { blueprint } = args;
  const sources = ['registered-course-blueprint'];
  const warnings: string[] = [];
  const lines = [
    `Credential: ${blueprint.credentialTitle}`,
    `Credential code: ${blueprint.credentialCode}`,
    `Jurisdiction: ${blueprint.state ?? args.state ?? 'federal'}`,
    `Blueprint version: ${blueprint.version}`,
    ...blueprint.modules.flatMap(moduleEvidence),
  ];

  const socCode = args.programSlug ? getSocCode(args.programSlug) : null;

  const ragQuery = [
    blueprint.credentialTitle,
    args.programSlug ?? blueprint.programSlug,
    blueprint.state ?? args.state,
    ...blueprint.modules.map((module) => module.domainKey ?? module.title),
  ].filter(Boolean).join(' | ');
  const ragContext = await getRAGContext(ragQuery);
  if (ragContext.trim()) {
    sources.push('Supabase-pgvector-RAG');
    lines.push(ragContext);
  } else {
    warnings.push('Supabase RAG returned no evidence for this course build');
  }

  if (!socCode) {
    warnings.push(`No SOC mapping exists for ${args.programSlug ?? blueprint.programSlug ?? 'course'}`);
  } else {
    lines.push(`O*NET-SOC occupation: ${socCode}`);
    if (isOnetConfigured()) {
      try {
        const occupation = await fetchOnetOccupation(socCode);
        sources.push('US-DOL-O*NET');
        lines.push(
          `Occupation: ${occupation.title}`,
          `Occupation description: ${occupation.description}`,
          ...occupation.tasks.slice(0, 20).map((x) => `O*NET task: ${x.task}`),
          ...occupation.skills.slice(0, 12).map((x) => `O*NET skill: ${x.name} (importance ${x.importance})`),
          ...occupation.knowledge.slice(0, 12).map((x) => `O*NET knowledge: ${x.name} (importance ${x.importance})`),
          ...occupation.work_activities.slice(0, 12).map((x) => `O*NET activity: ${x.name}`),
          ...occupation.technology_skills.slice(0, 20).map((x) => `O*NET technology: ${x.name}`),
        );
      } catch (error) {
        warnings.push(`O*NET evidence unavailable: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      warnings.push('O*NET credentials are not configured');
    }

    if (isCareerOneStopConfigured()) {
      try {
        const demand = await fetchCareerOneStopData(
          socCode,
          blueprint.credentialTitle,
          args.state ?? 'IN',
        );
        sources.push('US-DOL-CareerOneStop');
        lines.push(
          `CareerOneStop location: ${demand.location}`,
          `CareerOneStop current job postings: ${demand.job_postings_count}`,
        );
      } catch (error) {
        warnings.push(`CareerOneStop evidence unavailable: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      warnings.push('CareerOneStop credentials are not configured');
    }
  }

  const hasBlueprintCompetencies = blueprint.modules.some(
    (module) => (module.competencies?.length ?? 0) > 0,
  );
  const hasExternalEvidence = sources.some((source) => source.startsWith('US-DOL-'));

  if (warnings.length) {
    logger.warn('[course-factory/evidence] Evidence package warnings', {
      programSlug: args.programSlug ?? blueprint.programSlug,
      warnings,
    });
  }

  return {
    standardsBlock: lines.join('\n'),
    sources,
    socCode,
    grounded: hasBlueprintCompetencies || hasExternalEvidence,
    warnings,
  };
}
