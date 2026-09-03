#!/usr/bin/env tsx
/**
 * Sync published programs + program_credentials from static ProgramSchema files.
 *
 * Usage:
 *   pnpm catalog:sync              # upsert programs + credential links
 *   pnpm catalog:sync --dry-run    # print actions only
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in env (or .env.local).
 * Run after applying migration 20260705000011_program_catalog_unify.sql in Supabase.
 */

import { STATIC_PROGRAM_MAP } from '../data/programs/index';
import type { ProgramSchema } from '../lib/programs/program-schema';
import { toDbSlug } from '../lib/programs/slug';
import { requireAdminClient } from '../lib/supabase/admin';

const dryRun = process.argv.includes('--dry-run');

function primaryCredentialName(program: ProgramSchema): string | null {
  const first = program.credentials?.[0];
  if (first?.name?.trim()) return first.name.trim();
  return null;
}

function inferIssuerType(issuer: string): string {
  const lower = issuer.toLowerCase();
  if (lower.includes('elevate')) return 'elevate_issued';
  return 'elevate_proctored';
}

async function main() {
  const db = await requireAdminClient();
  if (!db) {
    console.error('Missing admin client — set SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  let programsUpserted = 0;
  let credentialsLinked = 0;

  for (const program of STATIC_PROGRAM_MAP.values()) {
    const dbSlug = toDbSlug(program.slug);
    const credentialName = primaryCredentialName(program);
    const row = {
      slug: dbSlug,
      title: program.title,
      short_description: program.subtitle?.slice(0, 500) ?? null,
      description: program.subtitle ?? program.title,
      category: program.category ?? program.sector,
      category_norm: program.sector,
      estimated_weeks: program.durationWeeks ?? null,
      credential_name: credentialName,
      credential_type: credentialName,
      image_url: program.heroImage ?? null,
      wioa_approved: program.funding?.wioa_eligible ?? false,
      funding_tags: program.funding?.wioa_eligible ? ['wioa'] : program.funding?.wrg_eligible ? ['wrg'] : null,
      published: true,
      is_active: true,
      status: 'published',
      updated_at: new Date().toISOString(),
    };

    if (dryRun) {
      console.log(`[dry-run] upsert program ${dbSlug} (${program.slug})`);
      programsUpserted += 1;
    } else {
      const { data, error } = await db
        .from('programs')
        .upsert(row, { onConflict: 'slug' })
        .select('id, slug')
        .single();
      if (error) {
        console.error(`programs upsert failed ${dbSlug}:`, error.message);
        continue;
      }
      programsUpserted += 1;

      const programId = data.id;
      const creds = program.credentials ?? [];
      for (let i = 0; i < creds.length; i++) {
        const cred = creds[i];
        if (!cred.name?.trim()) continue;

        const issuingAuthority = cred.issuer?.trim() || 'External Authority';
        let credentialId: string | null = null;

        const { data: existing } = await db
          .from('credential_registry')
          .select('id')
          .eq('name', cred.name.trim())
          .eq('issuing_authority', issuingAuthority)
          .maybeSingle();

        if (existing?.id) {
          credentialId = existing.id;
        } else {
          const { data: inserted, error: insertErr } = await db
            .from('credential_registry')
            .insert({
              name: cred.name.trim(),
              issuing_authority: issuingAuthority,
              description: cred.description?.slice(0, 2000) ?? null,
              issuer_type: inferIssuerType(issuingAuthority),
              proctor_authority: 'elevate',
              delivery: 'hybrid',
              requires_exam: false,
              verification_source: 'elevate',
              is_active: true,
              is_published: true,
            })
            .select('id')
            .single();
          if (insertErr) {
            console.error(`credential_registry insert failed ${cred.name}:`, insertErr.message);
            continue;
          }
          credentialId = inserted.id;
        }

        const { error: linkErr } = await db.from('program_credentials').upsert(
          {
            program_id: programId,
            credential_id: credentialId,
            is_required: true,
            sort_order: i,
            is_primary: i === 0,
            notes: cred.validity ? `Validity: ${cred.validity}` : null,
          },
          { onConflict: 'program_id,credential_id' },
        );

        if (linkErr) {
          // Fallback without is_primary if column conflict on older schemas
          const { error: linkErr2 } = await db.from('program_credentials').upsert(
            {
              program_id: programId,
              credential_id: credentialId,
              is_required: true,
              sort_order: i,
              notes: cred.validity ? `Validity: ${cred.validity}` : null,
            },
            { onConflict: 'program_id,credential_id' },
          );
          if (linkErr2) {
            console.error(`program_credentials link failed ${dbSlug}/${cred.name}:`, linkErr2.message);
            continue;
          }
        }
        credentialsLinked += 1;
      }
    }
  }

  console.log(
    dryRun
      ? `[dry-run] Would upsert ${programsUpserted} programs from static registry`
      : `Done: ${programsUpserted} programs upserted, ${credentialsLinked} credential links`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
