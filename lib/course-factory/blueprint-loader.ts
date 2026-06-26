/**
 * blueprint-loader.ts
 * 
 * Unified blueprint loading from:
 * - lib/curriculum/blueprints/ (static)
 * - lib/curriculum/blueprints/index.ts
 * 
 * Replaces:
 * - lib/curriculum/builders/getBlueprintForProgram.ts
 * - lib/course-builder/program-resolver.ts
 */

import { getAllBlueprints, type CredentialBlueprint } from '@/lib/curriculum/blueprints';
import type { SupabaseClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

// ─── Normalization ─────────────────────────────────────────────────────────────

function normalize(value?: string | null): string {
  return (value ?? '').trim().toLowerCase();
}

// ─── Program Row Type ─────────────────────────────────────────────────────────

interface ProgramRow {
  id: string;
  slug: string | null;
  code: string | null;
  credential_type: string | null;
  title?: string;
}

// ─── Blueprint Resolution ──────────────────────────────────────────────────────

/**
 * Resolve blueprint for a program by matching slug, code, or credential_type.
 * Priority: slug > code > credential_type
 */
export function resolveBlueprintForProgram(
  program: ProgramRow,
  blueprints: CredentialBlueprint[],
): CredentialBlueprint | null {
  const slug = normalize(program.slug);
  const code = normalize(program.code);
  const credentialType = normalize(program.credential_type);

  if (slug) {
    const bySlug = blueprints.find((bp) => normalize(bp.programSlug) === slug);
    if (bySlug) return bySlug;
  }

  if (code) {
    const byCode = blueprints.find((bp) => normalize(bp.credentialCode) === code);
    if (byCode) return byCode;
  }

  if (credentialType) {
    const byType = blueprints.find((bp) => normalize(bp.credentialCode) === credentialType);
    if (byType) return byType;
  }

  return null;
}

/**
 * Get all available blueprints (cached).
 */
export async function loadAllBlueprints(): Promise<CredentialBlueprint[]> {
  return getAllBlueprints();
}

/**
 * Get blueprint by program slug.
 */
export async function getBlueprintBySlug(slug: string): Promise<CredentialBlueprint | null> {
  const blueprints = await getAllBlueprints();
  const normalizedSlug = normalize(slug);
  return blueprints.find((bp) => normalize(bp.programSlug) === normalizedSlug) ?? null;
}

/**
 * Get blueprint by credential code.
 */
export async function getBlueprintByCredentialCode(code: string): Promise<CredentialBlueprint | null> {
  const blueprints = await getAllBlueprints();
  const normalizedCode = normalize(code);
  return blueprints.find((bp) => normalize(bp.credentialCode) === normalizedCode) ?? null;
}

// ─── Program Resolution ────────────────────────────────────────────────────────

/**
 * Resolve program from database by ID or slug.
 */
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

// ─── Blueprint with Program ───────────────────────────────────────────────────

export interface BlueprintWithProgram {
  program: ProgramRow;
  blueprint: CredentialBlueprint;
}

/**
 * Load blueprint and program together.
 * Returns null if either is not found.
 */
export async function loadBlueprintWithProgram(
  db: SupabaseClient,
  identifier: { programId?: string; programSlug?: string },
): Promise<BlueprintWithProgram | null> {
  // Load program
  const program = await resolveProgram(db, identifier);
  if (!program) {
    logger.warn('[blueprint-loader] Program not found', identifier);
    return null;
  }

  // Load all blueprints
  const blueprints = await getAllBlueprints();
  
  // Resolve blueprint
  const blueprint = resolveBlueprintForProgram(program, blueprints);
  if (!blueprint) {
    logger.warn('[blueprint-loader] No blueprint for program', { 
      programSlug: program.slug,
      programCode: program.code 
    });
    return null;
  }

  return { program, blueprint };
}

// ─── Blueprint Index ──────────────────────────────────────────────────────────

/**
 * Build an O(1) lookup index for blueprints by program slug.
 */
export async function buildBlueprintIndex(): Promise<Map<string, CredentialBlueprint>> {
  const blueprints = await getAllBlueprints();
  const index = new Map<string, CredentialBlueprint>();
  
  for (const bp of blueprints) {
    if (bp.programSlug) {
      index.set(normalize(bp.programSlug), bp);
    }
    if (bp.credentialCode) {
      index.set(`code:${normalize(bp.credentialCode)}`, bp);
    }
  }
  
  return index;
}

// ─── CLI Helpers ─────────────────────────────────────────────────────────────

/**
 * List all available blueprints (for CLI/debugging).
 */
export async function listBlueprints(): Promise<void> {
  const blueprints = await getAllBlueprints();
  
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
