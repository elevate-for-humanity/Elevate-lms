#!/usr/bin/env tsx
/**
 * Link program_holder_programs rows so each holder's dashboard shows the right verticals.
 *
 *   pnpm tsx --env-file=.env.local scripts/ops/sync-program-holder-dashboards.ts
 *   pnpm tsx --env-file=.env.local scripts/ops/sync-program-holder-dashboards.ts --dry-run
 */
import { createClient } from '@supabase/supabase-js';

const DRY_RUN = process.argv.includes('--dry-run');

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

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) process.exit(1);

  const db = createClient(url, key, { auth: { persistSession: false } });

  const allSlugs = [...new Set(Object.values(HOLDER_PROGRAMS).flat())];
  const { data: programs } = await db.from('programs').select('id, slug').in('slug', allSlugs);
  const slugToId = Object.fromEntries((programs ?? []).map((p) => [p.slug, p.id]));
  const missingSlugs = allSlugs.filter((s) => !slugToId[s]);
  if (missingSlugs.length) console.warn('⚠ Missing program slugs:', missingSlugs.join(', '));

  for (const [email, slugs] of Object.entries(HOLDER_PROGRAMS)) {
    const { data: holder } = await db
      .from('program_holders')
      .select('id, organization_name')
      .eq('contact_email', email)
      .maybeSingle();
    if (!holder) {
      console.warn(`Skip ${email} — no program_holders row`);
      continue;
    }

    const programIds = slugs.map((s) => slugToId[s]).filter(Boolean);
    console.log(`\n${holder.organization_name} (${email}) → ${slugs.length} programs`);

    if (!DRY_RUN) {
      await db.from('program_holders').update({ teaches_multiple: slugs.length > 1 }).eq('id', holder.id);
      if (programIds[0]) {
        await db.from('program_holders').update({ primary_program_id: programIds[0] }).eq('id', holder.id);
      }
    }

    for (const programId of programIds) {
      const slug = programs?.find((p) => p.id === programId)?.slug ?? programId;
      if (DRY_RUN) {
        console.log(`  [dry-run] link ${slug}`);
        continue;
      }
      const { error } = await db.from('program_holder_programs').upsert(
        { program_holder_id: holder.id, program_id: programId, status: 'active' },
        { onConflict: 'program_holder_id,program_id' },
      );
      if (error) console.warn(`  ⚠ ${slug}:`, error.message);
      else console.log(`  ✅ ${slug}`);
    }
  }

  // Prestige — barber host partner dashboard (Elizabeth Greene)
  console.log('\n=== Prestige barber partner ===');
  const { data: prestigeUser } = await db
    .from('profiles')
    .select('id, role')
    .eq('email', PRESTIGE_PARTNER.email)
    .maybeSingle();
  let userId = prestigeUser?.id;
  if (!userId) {
    const { data: listed } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
    userId = listed?.users?.find((u) => u.email?.toLowerCase() === PRESTIGE_PARTNER.email)?.id;
  }
  if (!userId) {
    console.warn('Prestige auth user not found');
  } else if (!DRY_RUN) {
    await db.from('profiles').upsert(
      {
        id: userId,
        email: PRESTIGE_PARTNER.email,
        full_name: PRESTIGE_PARTNER.name,
        role: 'partner',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    );
    await db.auth.admin.updateUserById(userId, { app_metadata: { role: 'partner' }, email_confirm: true });
    await db.from('partners').update({ partner_type: 'barber', type: 'barber' }).eq('id', PRESTIGE_PARTNER.partnerId);
    const { data: existingPu } = await db
      .from('partner_users')
      .select('id')
      .eq('user_id', userId)
      .eq('partner_id', PRESTIGE_PARTNER.partnerId)
      .maybeSingle();
    if (!existingPu) {
      await db.from('partner_users').insert({
        user_id: userId,
        partner_id: PRESTIGE_PARTNER.partnerId,
        role: 'owner',
        status: 'active',
      });
    }
    console.log('✅ Prestige partner wired for', PRESTIGE_PARTNER.email);
  } else {
    console.log('[dry-run] Would wire Prestige partner');
  }

  // Backfill mou_signatures for holders with mou_signed but no digital row
  if (!DRY_RUN) {
    const { data: holders } = await db
      .from('program_holders')
      .select('id, user_id, contact_email, mou_signed, mou_signed_at')
      .eq('mou_signed', true);
    for (const h of holders ?? []) {
      if (!h.user_id) continue;
      const { data: sig } = await db
        .from('mou_signatures')
        .select('id')
        .eq('user_id', h.user_id)
        .maybeSingle();
      if (sig) continue;
      const { error: sigErr } = await db.from('mou_signatures').insert({
        user_id: h.user_id,
        program_holder_id: h.id,
        signed_at: h.mou_signed_at ?? new Date().toISOString(),
        agreed_at: h.mou_signed_at ?? new Date().toISOString(),
        signer_name: h.contact_email,
        contact_email: h.contact_email,
        signature_data: 'admin-backfill-mou-signed',
        partner_type: 'program_holder',
        agreed: true,
        mou_version: 'admin-backfill',
      });
      if (sigErr) console.warn(`  ⚠ mou_signatures backfill ${h.contact_email}:`, sigErr.message);
      else console.log(`✅ mou_signatures backfill: ${h.contact_email}`);
    }
  }

  console.log('\nDone.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
