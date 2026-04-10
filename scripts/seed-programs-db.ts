/**
 * scripts/seed-programs-db.ts
 *
 * Seeds the 11 active programs into the live DB with delivery model,
 * enrollment type, and funding options.
 *
 * Run AFTER applying migration 20260503000005 in Supabase Dashboard.
 *
 * Usage:
 *   npx tsx scripts/seed-programs-db.ts
 *
 * Safe to run multiple times — uses upsert on slug.
 */

import { createAdminClient } from '../lib/supabase/admin';

const PROGRAMS = [
  {
    slug: 'hvac-technician',
    title: 'HVAC Technician',
    description: '20-week workforce training program covering HVAC installation, maintenance, and EPA 608 certification.',
    delivery_model: 'hybrid',
    enrollment_type: 'internal',
    has_lms_course: true,
    published: true,
    funding: ['wioa', 'wrg', 'self_pay'],
  },
  {
    slug: 'bookkeeping',
    title: 'Bookkeeping & QuickBooks',
    description: 'Self-paced bookkeeping and QuickBooks certification program.',
    delivery_model: 'internal',
    enrollment_type: 'internal',
    has_lms_course: true,
    published: true,
    funding: ['self_pay'],
  },
  {
    slug: 'peer-recovery-specialist',
    title: 'Certified Peer Recovery Coach',
    description: 'Indiana CPRS certification program for peer recovery support professionals.',
    delivery_model: 'hybrid',
    enrollment_type: 'internal',
    has_lms_course: true,
    published: true,
    funding: ['wioa', 'self_pay'],
  },
  {
    slug: 'medical-assistant',
    title: 'Medical Assistant',
    description: 'Clinical and administrative medical assistant training with certification prep.',
    delivery_model: 'hybrid',
    enrollment_type: 'internal',
    has_lms_course: false,
    published: true,
    funding: ['wioa', 'self_pay'],
  },
  {
    slug: 'barber-apprenticeship',
    title: 'Barber Apprenticeship',
    description: 'Indiana-registered barber apprenticeship combining Milady curriculum with on-the-job training.',
    delivery_model: 'hybrid',
    enrollment_type: 'internal',
    has_lms_course: false,
    published: true,
    funding: ['employer_paid', 'wioa', 'self_pay'],
  },
  {
    slug: 'cosmetology-apprenticeship',
    title: 'Cosmetology Apprenticeship',
    description: 'Indiana-registered cosmetology apprenticeship with Milady curriculum.',
    delivery_model: 'hybrid',
    enrollment_type: 'internal',
    has_lms_course: false,
    published: true,
    funding: ['employer_paid', 'wioa'],
  },
  {
    slug: 'cna',
    title: 'CNA (Certified Nursing Assistant)',
    description: '6-week CNA training program preparing students for the Indiana competency exam.',
    delivery_model: 'internal',
    enrollment_type: 'internal',
    has_lms_course: false,
    published: true,
    funding: ['self_pay'],
  },
  {
    slug: 'cdl-training',
    title: 'CDL Class A Training',
    description: 'Commercial Driver License Class A training with WIOA funding available.',
    delivery_model: 'internal',
    enrollment_type: 'internal',
    has_lms_course: false,
    published: true,
    funding: ['wioa', 'self_pay'],
  },
  {
    slug: 'cpr-first-aid',
    title: 'CPR, AED & First Aid',
    description: 'HSI-certified CPR, AED, and First Aid certification. Included free with any Elevate program.',
    delivery_model: 'partner',
    enrollment_type: 'internal',
    has_lms_course: false,
    published: true,
    funding: ['self_pay'],
  },
  {
    slug: 'business',
    title: 'Business Administration',
    description: 'Business management and entrepreneurship training with WIOA funding available.',
    delivery_model: 'hybrid',
    enrollment_type: 'internal',
    has_lms_course: false,
    published: true,
    funding: ['wioa', 'self_pay'],
  },
  {
    slug: 'phlebotomy',
    title: 'Phlebotomy Technician',
    description: '4-week phlebotomy technician training with NHA certification prep.',
    delivery_model: 'internal',
    enrollment_type: 'internal',
    has_lms_course: false,
    published: true,
    funding: ['self_pay'],
  },
] as const;

async function main() {
  // SAFE: non-request-time context — scripts/ or internal admin.ts, hydration guaranteed by caller
  const db = createAdminClient();
  if (!db) {
    console.error('FAIL: Admin client unavailable. Check SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(1);
  }

  let upserted = 0;
  let fundingInserted = 0;
  let errors = 0;

  for (const prog of PROGRAMS) {
    const { funding, ...programData } = prog;

    // Upsert program row
    const { data: row, error: upsertError } = await db
      .from('programs')
      .upsert(
        {
          slug: programData.slug,
          title: programData.title,
          description: programData.description,
          delivery_model: programData.delivery_model,
          enrollment_type: programData.enrollment_type,
          has_lms_course: programData.has_lms_course,
          published: programData.published,
          is_active: true,
        },
        { onConflict: 'slug', ignoreDuplicates: false }
      )
      .select('id, slug')
      .single();

    if (upsertError || !row) {
      console.error(`FAIL upsert ${prog.slug}:`, upsertError?.message ?? 'no row returned');
      errors++;
      continue;
    }

    upserted++;
    console.log(`  upserted: ${row.slug} (${row.id})`);

    // Upsert funding rows
    for (const type of funding) {
      const { error: fundingError } = await db
        .from('program_funding')
        .upsert(
          { program_id: row.id, type, is_active: true },
          { onConflict: 'program_id,type', ignoreDuplicates: false }
        );

      if (fundingError) {
        // program_funding table may not exist yet (migration pending)
        if (fundingError.message.includes('does not exist')) {
          console.warn(`  WARN: program_funding table missing — apply migration 20260503000005 first`);
          break;
        }
        console.error(`  FAIL funding ${type} for ${prog.slug}:`, fundingError.message);
        errors++;
      } else {
        fundingInserted++;
      }
    }
  }

  console.log(`\nDone: ${upserted} programs upserted, ${fundingInserted} funding rows, ${errors} errors`);
  if (errors > 0) process.exit(1);
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
