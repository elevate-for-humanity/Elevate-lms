/**
 * getProgramBySlug — loads a ProgramSchema from data/programs/<slug>.ts
 *
 * Used by program-specific pages (request-info, etc.) that need the full
 * canonical program data including CTA links, specs, and credentials.
 *
 * Returns null if the program does not exist.
 */

import type { ProgramSchema } from './program-schema';

// Static registry — add new programs here when created
const PROGRAM_REGISTRY: Record<string, () => Promise<{ default: ProgramSchema }>> = {
  'hvac-technician':               () => import('@/data/programs/hvac-technician'),
  'barber-apprenticeship':         () => import('@/data/programs/barber-apprenticeship'),
  'bookkeeping':                   () => import('@/data/programs/bookkeeping'),
  'business-administration':       () => import('@/data/programs/business-administration'),
  'cad-drafting':                  () => import('@/data/programs/cad-drafting'),
  'cdl-training':                  () => import('@/data/programs/cdl-training'),
  'cna':                           () => import('@/data/programs/cna'),
  'construction-trades-certification': () => import('@/data/programs/construction-trades-certification'),
  'cosmetology-apprenticeship':    () => import('@/data/programs/cosmetology-apprenticeship'),
  'culinary-apprenticeship':       () => import('@/data/programs/culinary-apprenticeship'),
  'cybersecurity-analyst':         () => import('@/data/programs/cybersecurity-analyst'),
  'diesel-mechanic':               () => import('@/data/programs/diesel-mechanic'),
  'electrical':                    () => import('@/data/programs/electrical'),
  'entrepreneurship':              () => import('@/data/programs/entrepreneurship'),
  'forklift':                      () => import('@/data/programs/forklift'),
  'graphic-design':                () => import('@/data/programs/graphic-design'),
  'it-help-desk':                  () => import('@/data/programs/it-help-desk'),
  'medical-assistant':             () => import('@/data/programs/medical-assistant'),
  'nail-technician-apprenticeship':() => import('@/data/programs/nail-technician-apprenticeship'),
  'network-administration':        () => import('@/data/programs/network-administration'),
  'network-support-technician':    () => import('@/data/programs/network-support-technician'),
  'office-administration':         () => import('@/data/programs/office-administration'),
  'peer-recovery-specialist':      () => import('@/data/programs/peer-recovery-specialist'),
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
  const loader = PROGRAM_REGISTRY[slug];
  if (!loader) return null;
  try {
    const mod = await loader();
    // Data files use named exports (e.g. HVAC_TECHNICIAN) — find the first ProgramSchema export
    const named = Object.values(mod).find(
      (v) => v && typeof v === 'object' && 'slug' in v && 'title' in v && 'cta' in v
    ) as ProgramSchema | undefined;
    return named ?? null;
  } catch {
    return null;
  }
}
