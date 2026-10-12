#!/usr/bin/env tsx
/**
 * Link program_holder_programs rows so each holder's dashboard shows the right verticals.
 *
 *   pnpm tsx --env-file=.env.local scripts/ops/sync-program-holder-dashboards.ts
 *   pnpm tsx --env-file=.env.local scripts/ops/sync-program-holder-dashboards.ts --dry-run
 */
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
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
    'esthetician-apprenticeship',
    'nail-technician-apprenticeship',
    'cosmetology-apprenticeship',
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

const PRESTIGE_PARTNER = {
  email: 'info@prestigeelevation.com',
  partnerId: '9dffa854-1002-42e7-bad3-a8d626326d6e',
  name: 'Elizabeth L. Greene',
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
      .select('id, organization_name')
      .eq('contact_email', email)
      .maybeSingle().throwOnError();
    if (!holder) {
      console.warn(`Skip ${email} — no program_holders row`);
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

  // Prestige — barber host partner dashboard (Elizabeth Greene)
  console.info('\n=== Prestige barber partner ===');
  const { data: prestigeUser } = await db
    .from('profiles')
    .select('id, role')
    .eq('email', PRESTIGE_PARTNER.email)
    .maybeSingle().throwOnError();
  let userId = prestigeUser?.id;
  if (!userId) {
    const { data: listed, error: listError } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (listError) throw listError;
    const users: User[] = listed?.users ?? [];
    userId = users.find((user) => user.email?.toLowerCase() === PRESTIGE_PARTNER.email)?.id;
  }
  if (!userId) {
    console.warn('Prestige auth user not found');
  } else if (!dryRun) {
    await db.from('profiles').upsert(
      {
        id: userId,
        email: PRESTIGE_PARTNER.email,
        full_name: PRESTIGE_PARTNER.name,
        role: 'partner',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    ).throwOnError();
    const { error: authError } = await db.auth.admin.updateUserById(userId, { app_metadata: { role: 'partner' } });
    if (authError) throw authError;
    await db.from('partners').update({ partner_type: 'barber', type: 'barber' }).eq('id', PRESTIGE_PARTNER.partnerId).throwOnError();
    const { data: existingPu } = await db
      .from('partner_users')
      .select('id')
      .eq('user_id', userId)
      .eq('partner_id', PRESTIGE_PARTNER.partnerId)
      .maybeSingle().throwOnError();
    if (!existingPu) {
      await db.from('partner_users').insert({
        user_id: userId,
        partner_id: PRESTIGE_PARTNER.partnerId,
        role: 'owner',
        status: 'active',
      }).throwOnError();
    }
    console.info('✅ Prestige partner wired for', PRESTIGE_PARTNER.email);
  } else {
    console.info('[dry-run] Would wire Prestige partner');
  }

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
