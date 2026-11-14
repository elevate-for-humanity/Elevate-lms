import type { ProgramSchema } from './program-schema';
import { getPublishedProgramBySlug } from './getProgramBySlug';
import { getStaticProgram } from '@/data/programs';
import { resolveCanonicalSlug } from './slug';
import { isWithdrawnProgram } from './withdrawn-programs.mjs';

const DB_MANAGED_CTA_SLUGS = new Set(['peer-recovery-specialist', 'hvac-technician']);

/** Shared program registry supplies complete content; DB-managed CTAs retain their authority. */
export async function getProgramBySlug(input: string): Promise<ProgramSchema | null> {
  const slug = resolveCanonicalSlug(input);
  if (isWithdrawnProgram(slug)) return null;
  const program = getStaticProgram(slug);
  if (!program) return null;
  if (!DB_MANAGED_CTA_SLUGS.has(slug)) return program;
  const record = await getPublishedProgramBySlug(slug);
  return {
    ...program,
    cta: {
      ...program.cta,
      applyHref: record.program_ctas.find(cta => cta.cta_type === 'apply')?.href ?? program.cta.applyHref,
      requestInfoHref: record.program_ctas.find(cta => cta.cta_type === 'request_info')?.href ?? program.cta.requestInfoHref,
    },
  };
}
