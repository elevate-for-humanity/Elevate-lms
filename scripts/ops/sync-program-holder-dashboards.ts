#!/usr/bin/env tsx
/**
 * Link program_holder_programs rows so each holder's dashboard shows the right verticals.
 *
 *   pnpm tsx --env-file=.env.local scripts/ops/sync-program-holder-dashboards.ts
 *   pnpm tsx --env-file=.env.local scripts/ops/sync-program-holder-dashboards.ts --dry-run
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { pathToFileURL } from 'node:url';

const DRY_RUN = process.argv.includes('--dry-run');

/** Legacy/intake labels resolve to the canonical program catalog slug. */
const PROGRAM_SLUG_ALIASES: Record<string, string> = {
  entrepreneurship: 'business-startup',
  'entrepreneurship-small-business': 'business-startup',
};

function canonicalProgramSlugs(slugs: string[]) {
  return [...new Set(slugs.map((slug) => PROGRAM_SLUG_ALIASES[slug] ?? slug))];
}

/** contact_email → program slugs they oversee */
const HOLDER_PROGRAMS: Record<string, string[]> = {
  'mesmerizedbybeautyl@yahoo.com': [
    'cosmetology-apprenticeship',
    'barber-apprenticeship',
    'esthetician-apprenticeship',
    'nail-technician-apprenticeship',
  ],
  'info@centerofdestiny.org': [
    'business-startup',
    'bookkeeping',
    
    'business-administration',
    'entrepreneurship',
  ],
  'indyondemandservices@gmail.com': ['hvac-technician'],
  'doreen.hawkins01@outlook.com': [
    'peer-recovery-specialist',
    'peer-support',
    'life-coach-certification-wioa',
  ],
  'amecosenterprise@gmail.com': [
    'it-help-desk',
    'data-analytics',
    'cybersecurity-analyst',
    'network-administration',
    'network-support-technician',
    'web-development',
    'software-development',
    'graphic-design',
    'bookkeeping',
    
    'office-administration',
    'business-administration',
    'entrepreneurship',
    'project-management',
    'cad-drafting',
    'information-technology',
  ],
};

export async function syncProgramHolderDashboards(db: SupabaseClient, dryRun = false) {
  const allSlugs = [...new Set(Object.values(HOLDER_PROGRAMS).flatMap(canonicalProgramSlugs))];
  const { data: programs } = await db.from('programs').select('id, slug').in('slug', allSlugs).throwOnError();
  const slugToId = Object.fromEntries((programs ?? []).map((p) => [p.slug, p.id]));
  const missingSlugs = allSlugs.filter((s) => !slugToId[s]);
  if (missingSlugs.length) throw new Error('Missing program slugs: ' + missingSlugs.join(', ') + '. No holder mappings were changed.');

  for (const [email, configuredSlugs] of Object.entries(HOLDER_PROGRAMS)) {
    const slugs = canonicalProgramSlugs(configuredSlugs);
    const { data: holder } = await db
      .from('program_holders')
      .select('id, organization_name, status')
      .eq('contact_email', email)
      .maybeSingle().throwOnError();
    if (!holder) {
      console.warn(`Skip ${email} — no program_holders row`);
      continue;
    }

    if (!['active', 'approved', 'approved_pending_mou'].includes(holder.status)) {
      console.info(`Skip ${holder.organization_name} — holder is ${holder.status}`);
      continue;
    }

    const programIds = slugs.map((s) => slugToId[s]).filter(Boolean);
    console.info(`\n${holder.organization_name} (${email}) → ${slugs.length} programs`);

    if (!dryRun) {
      await db.from('program_holders').update({ teaches_multiple: slugs.length > 1 }).eq('id', holder.id).throwOnError();
      if (programIds[0]) {
        await db.from('program_holders').update({ primary_program_id: programIds[0] }).eq('id', holder.id).throwOnError();
      }
    }

    for (const programId of programIds) {
      const slug = programs?.find((p) => p.id === programId)?.slug ?? programId;
      if (dryRun) {
        console.info(`  [dry-run] link ${slug}`);
        continue;
      }
      const { error } = await db.from('program_holder_programs').upsert(
        { program_holder_id: holder.id, program_id: programId, status: 'active' },
        { onConflict: 'program_holder_id,program_id' },
      );
      if (error) throw new Error(`Program link failed for ${slug}: ${error.message}`);
      else console.info(`  ✅ ${slug}`);
    }
  }

  // Archived Prestige remains untouched. Holder mapping repair must never
  // provision partner access or replace an existing administrator role.

  // A legacy signed flag is not a digital signature. Report missing evidence;
  // never invent signer data, consent, or a signing timestamp during account repair.
  const { data: signedHolders } = await db
    .from('program_holders')
    .select('id, user_id, contact_email')
    .eq('mou_signed', true)
    .throwOnError();
  for (const holder of signedHolders ?? []) {
    if (!holder.user_id) continue;
    const { data: signature } = await db
      .from('mou_signatures')
      .select('id')
      .eq('program_holder_id', holder.id)
      .eq('user_id', holder.user_id)
      .limit(1)
      .maybeSingle()
      .throwOnError();
    if (!signature) console.warn(`MOU evidence missing for ${holder.contact_email}; obtain the original signed document or a new signature.`);
  }

  console.info('\nDone.');
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase URL and service-role credential are required');
  const db = createClient(url, key, { auth: { persistSession: false } });
  await syncProgramHolderDashboards(db, DRY_RUN);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => { console.error(error); process.exitCode = 1; });
}
