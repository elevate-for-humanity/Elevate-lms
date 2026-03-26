/**
 * getProgramBySlug — loads a ProgramSchema from data/programs/<slug>.ts
 *
 * Used by program-specific pages (request-info, etc.) that need the full
 * canonical program data including CTA links, specs, and credentials.
 *
 * For programs migrated to DB-only (no static file), falls back to a minimal
 * ProgramSchema built from the DB record. Add migrated slugs to DB_MIGRATED_SLUGS.
 *
 * Returns null if the program does not exist.
 */

import type { ProgramSchema } from './program-schema';
import { getPublishedProgramBySlug } from './getProgramBySlug';
import { logger } from '@/lib/logger';

// Slugs fully migrated to DB — no static data/programs/<slug>.ts file exists.
// For these, a minimal ProgramSchema is synthesized from the DB record.
const DB_MIGRATED_SLUGS = new Set([
  'hvac-technician',
  'peer-recovery-specialist',
  'cna',
]);

// Static registry — add new programs here when created
const PROGRAM_REGISTRY: Record<string, () => Promise<{ default: ProgramSchema }>> = {
  // hvac-technician removed — DB-driven, handled via DB_MIGRATED_SLUGS above
  'barber-apprenticeship':         () => import('@/data/programs/barber-apprenticeship'),
  'beauty-career-educator':        () => import('@/data/programs/beauty-career-educator'),
  'bookkeeping':                   () => import('@/data/programs/bookkeeping'),
  'business-administration':       () => import('@/data/programs/business-administration'),
  'cad-drafting':                  () => import('@/data/programs/cad-drafting'),
  'cdl-training':                  () => import('@/data/programs/cdl-training'),
  'construction-trades-certification': () => import('@/data/programs/construction-trades-certification'),
  'cosmetology-apprenticeship':    () => import('@/data/programs/cosmetology-apprenticeship'),
  'culinary-apprenticeship':       () => import('@/data/programs/culinary-apprenticeship'),
  'cybersecurity-analyst':         () => import('@/data/programs/cybersecurity-analyst'),
  'diesel-mechanic':               () => import('@/data/programs/diesel-mechanic'),
  'electrical':                    () => import('@/data/programs/electrical'),
  'emergency-health-safety':       () => import('@/data/programs/emergency-health-safety'),
  'health-safety':                 () => import('@/data/programs/emergency-health-safety'),
  'entrepreneurship':              () => import('@/data/programs/entrepreneurship'),
  'esthetician':                   () => import('@/data/programs/esthetician'),
  'forklift':                      () => import('@/data/programs/forklift'),
  'graphic-design':                () => import('@/data/programs/graphic-design'),
  'home-health-aide':              () => import('@/data/programs/home-health-aide'),
  'it-help-desk':                  () => import('@/data/programs/it-help-desk'),
  'medical-assistant':             () => import('@/data/programs/medical-assistant'),
  'nail-technician-apprenticeship':() => import('@/data/programs/nail-technician-apprenticeship'),
  'network-administration':        () => import('@/data/programs/network-administration'),
  'network-support-technician':    () => import('@/data/programs/network-support-technician'),
  'office-administration':         () => import('@/data/programs/office-administration'),
  'pharmacy-technician':           () => import('@/data/programs/pharmacy-technician'),
  'phlebotomy':                    () => import('@/data/programs/phlebotomy'),
  'plumbing':                      () => import('@/data/programs/plumbing'),
  'project-management':            () => import('@/data/programs/project-management'),
  'software-development':          () => import('@/data/programs/software-development'),
  'tax-preparation':               () => import('@/data/programs/tax-preparation'),
  'web-development':               () => import('@/data/programs/web-development'),
  'welding':                       () => import('@/data/programs/welding'),
};

export async function getProgramBySlug(slug: string): Promise<ProgramSchema | null> {
  // DB-migrated programs: synthesize a minimal ProgramSchema from the DB record.
  // These slugs have no static file — DB is the only source. Throw on failure.
  if (DB_MIGRATED_SLUGS.has(slug)) {
    const db = await getPublishedProgramBySlug(slug);
    const applyCta = db.program_ctas.find((c) => c.cta_type === 'apply');
    const requestInfoCta = db.program_ctas.find((c) => c.cta_type === 'request_info');
    // Return a minimal ProgramSchema-compatible object with the fields
    // request-info and other shared pages actually use.
    return {
      slug: db.slug,
      title: db.title,
      subtitle: db.short_description ?? '',
      category: 'Workforce Training',
      durationWeeks: db.length_weeks ?? 12,
      hoursPerWeekMin: 0,
      hoursPerWeekMax: 0,
      credentials: [],
      enrollmentTracks: [],
      outcomes: [],
      curriculum: [],
      cta: {
        applyHref: applyCta?.href ?? `/apply?program=${db.slug}`,
        requestInfoHref: requestInfoCta?.href ?? `/programs/${db.slug}/request-info`,
      },
    } as unknown as ProgramSchema;
  }

  const loader = PROGRAM_REGISTRY[slug];
  if (!loader) return null;
  try {
    const mod = await loader();
    // Data files use named exports (e.g. HVAC_TECHNICIAN) — find the first ProgramSchema export
    const named = Object.values(mod).find(
      (v) => v && typeof v === 'object' && 'slug' in v && 'title' in v && 'cta' in v
    ) as ProgramSchema | undefined;
    return named ?? null;
  } catch (err) {
    logger.error(`[getProgramBySlug] Failed to load static program file for slug '${slug}':`, err);
    return null;
  }
}
