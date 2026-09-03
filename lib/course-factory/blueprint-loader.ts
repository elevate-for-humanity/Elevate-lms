/**
 * blueprint-loader.ts
 *
 * Unified blueprint loading from the canonical curriculum registry.
 */

import { getAllBlueprints, type CredentialBlueprint } from '@/lib/curriculum/blueprints';
import type { SupabaseClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

function normalize(value?: string | null): string {
  return (value ?? '').trim().toLowerCase();
}

interface ProgramRow {
  id: string;
  slug: string | null;
  code: string | null;
  credential_type: string | null;
  title?: string;
}

/**
 * Elevate-authored courseware must never inherit a third-party provider brand
 * merely because the learning objectives prepare a learner for an industry
 * credential. Actual testing/provider integrations remain separate systems.
 */
function sanitizeElevateAuthoredBlueprint(source: CredentialBlueprint): CredentialBlueprint {
  const blueprint = structuredClone(source) as CredentialBlueprint & Record<string, any>;

  if (normalize(blueprint.programSlug) !== 'entrepreneurship') return blueprint;

  blueprint.id = 'entrepreneurship-small-business-v2-us';
  blueprint.title = 'Entrepreneurship & Small Business — U.S. v2';
  blueprint.credentialSlug = 'entrepreneurship-small-business-v2-us';
  blueprint.credentialTitle = 'Entrepreneurship and Small Business (ESB) U.S. v.2';
  blueprint.credentialCode = 'ESB-V2-US';
  blueprint.sourceAuthority = 'Elevate for Humanity';
  blueprint.sourceReference =
    'Original Elevate entrepreneurship and small-business competency framework for U.S. workforce training.';
  blueprint.certificationPathway = undefined;
  blueprint.externalCourses = undefined;
  delete blueprint.certiportExamCodes;
  delete blueprint.trackVariants;

  blueprint.modules = blueprint.modules.map((courseModule) => ({
    ...courseModule,
    lessons: (courseModule.lessons ?? []).map((lesson) => {
      const clean = { ...lesson } as Record<string, any>;
      delete clean.partnerExamCode;
      return clean as typeof lesson;
    }),
  }));

  return blueprint;
}

export function resolveBlueprintForProgram(
  program: ProgramRow,
  blueprints: CredentialBlueprint[],
): CredentialBlueprint | null {
  const slug = normalize(program.slug);
  const code = normalize(program.code);
  const credentialType = normalize(program.credential_type);

  let resolved: CredentialBlueprint | undefined;
  if (slug) resolved = blueprints.find((bp) => normalize(bp.programSlug) === slug);
  if (!resolved && code) resolved = blueprints.find((bp) => normalize(bp.credentialCode) === code);
  if (!resolved && credentialType) {
    resolved = blueprints.find((bp) => normalize(bp.credentialCode) === credentialType);
  }

  return resolved ? sanitizeElevateAuthoredBlueprint(resolved) : null;
}

export async function loadAllBlueprints(): Promise<CredentialBlueprint[]> {
  const blueprints = await getAllBlueprints();
  return blueprints.map(sanitizeElevateAuthoredBlueprint);
}

export async function getBlueprintBySlug(slug: string): Promise<CredentialBlueprint | null> {
  const blueprints = await getAllBlueprints();
  const normalizedSlug = normalize(slug);
  const blueprint = blueprints.find((bp) => normalize(bp.programSlug) === normalizedSlug);
  return blueprint ? sanitizeElevateAuthoredBlueprint(blueprint) : null;
}

export async function getBlueprintByCredentialCode(code: string): Promise<CredentialBlueprint | null> {
  const blueprints = await getAllBlueprints();
  const normalizedCode = normalize(code);
  const blueprint = blueprints.find((bp) => normalize(bp.credentialCode) === normalizedCode);
  return blueprint ? sanitizeElevateAuthoredBlueprint(blueprint) : null;
}

export async function resolveProgram(
  db: SupabaseClient,
  identifier: { id?: string; slug?: string },
): Promise<ProgramRow | null> {
  if (identifier.id) {
    const { data } = await db
      .from('programs')
      .select('id, slug, code, credential_type, title')
      .eq('id', identifier.id)
      .maybeSingle<ProgramRow>();
    return data;
  }

  if (identifier.slug) {
    const { data } = await db
      .from('programs')
      .select('id, slug, code, credential_type, title')
      .eq('slug', identifier.slug)
      .maybeSingle<ProgramRow>();
    return data;
  }

  return null;
}

export interface BlueprintWithProgram {
  program: ProgramRow;
  blueprint: CredentialBlueprint;
}

export async function loadBlueprintWithProgram(
  db: SupabaseClient,
  identifier: { programId?: string; programSlug?: string },
): Promise<BlueprintWithProgram | null> {
  const program = await resolveProgram(db, { id: identifier.programId, slug: identifier.programSlug });
  if (!program) {
    logger.warn('[blueprint-loader] Program not found', identifier);
    return null;
  }

  const blueprints = await getAllBlueprints();
  const blueprint = resolveBlueprintForProgram(program, blueprints);
  if (!blueprint) {
    logger.warn('[blueprint-loader] No blueprint for program', {
      programSlug: program.slug,
      programCode: program.code,
    });
    return null;
  }

  return { program, blueprint };
}

export async function buildBlueprintIndex(): Promise<Map<string, CredentialBlueprint>> {
  const blueprints = await loadAllBlueprints();
  const index = new Map<string, CredentialBlueprint>();

  for (const bp of blueprints) {
    if (bp.programSlug) index.set(normalize(bp.programSlug), bp);
    if (bp.credentialCode) index.set(`code:${normalize(bp.credentialCode)}`, bp);
  }

  return index;
}

export async function listBlueprints(): Promise<void> {
  const blueprints = await loadAllBlueprints();

  console.info('\n📋 Available Blueprints:\n');
  console.info('┌──────────────────────────────────────────────────────────────────┐');
  console.info('│ Program Slug           │ Credential                     │ Mods │');
  console.info('├──────────────────────────────────────────────────────────────────┤');

  for (const bp of blueprints) {
    const modules = bp.modules?.length ?? 0;
    const slug = (bp.programSlug || '').padEnd(22);
    const cred = (bp.credentialTitle || '').substring(0, 28).padEnd(28);
    console.info(`│ ${slug} │ ${cred} │ ${String(modules).padStart(4)} │`);
  }

  console.info('└──────────────────────────────────────────────────────────────────┘');
  console.info(`\nTotal: ${blueprints.length} blueprints\n`);
}
