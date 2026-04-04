/**
 * lib/partners/seed-partner-courses.ts
 *
 * Persists the static partner course catalog into partner_lms_providers
 * and partner_lms_courses. Idempotent — safe to re-run.
 *
 * Run via:
 *   npx tsx scripts/seed-partner-data.ts           # dry run
 *   npx tsx scripts/seed-partner-data.ts --apply   # write to DB
 *
 * Requires migration 20260503000001_partner_scorm_schema_fixes.sql to be
 * applied first (adds course_type column and provider PK).
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import {
  HSI_COURSES,
  NRF_COURSES,
  JRI_COURSES,
  CAREERSAFE_COURSES,
  type PartnerCourse,
} from './link-based-integration';

// ── Provider definitions ──────────────────────────────────────────────────────

interface ProviderDef {
  slug: string;
  name: string;
  type: string;
  websiteUrl: string;
  supportEmail: string;
  courses: PartnerCourse[];
}

const PROVIDERS: ProviderDef[] = [
  {
    slug: 'hsi',
    name: 'Health & Safety Institute',
    type: 'certification_body',
    websiteUrl: 'https://www.hsi.com',
    supportEmail: 'support@hsi.com',
    courses: HSI_COURSES,
  },
  {
    slug: 'nrf',
    name: 'National Restaurant Foundation',
    type: 'certification_body',
    websiteUrl: 'https://www.servsafe.com',
    supportEmail: 'support@servsafe.com',
    courses: NRF_COURSES,
  },
  {
    slug: 'jri',
    name: 'Job Ready Indy (EmployIndy)',
    type: 'workforce_partner',
    websiteUrl: 'https://employindy.org',
    supportEmail: 'info@employindy.org',
    courses: JRI_COURSES,
  },
  {
    slug: 'careersafe',
    name: 'CareerSafe',
    type: 'safety_training',
    websiteUrl: 'https://www.careersafeonline.com',
    supportEmail: 'support@careersafeonline.com',
    courses: CAREERSAFE_COURSES,
  },
  // Beauty/barber theory delivered via Elevate LMS — no external partner seeded
];

// ── Micro-course IDs (short certifications, not full partner programs) ────────

const MICRO_COURSE_IDS = new Set([
  'hsi-cpr-aed',
  'hsi-first-aid',
  'hsi-bloodborne-pathogens',
  'careersafe-osha10-general',
  'careersafe-osha10-construction',
  'careersafe-bloodborne-pathogens',
  'careersafe-infection-control',
  'careersafe-patient-safety',
  'nrf-servsafe-food-handler',
]);

// ── Seeder ────────────────────────────────────────────────────────────────────

export async function seedPartnerCourses(
  db: SupabaseClient,
  apply: boolean
): Promise<{ providersUpserted: number; coursesUpserted: number; errors: string[] }> {
  const errors: string[] = [];
  let providersUpserted = 0;
  let coursesUpserted = 0;

  for (const provider of PROVIDERS) {
    if (!apply) {
      logger.info(`[DRY RUN] Provider: ${provider.name} (${provider.courses.length} courses)`);
      for (const c of provider.courses) {
        const courseType = MICRO_COURSE_IDS.has(c.id) ? 'micro' : 'partner';
        logger.info(`  [${courseType}] ${c.title}`);
      }
      continue;
    }

    // Upsert provider row — identity key: provider_name
    const { data: providerRow, error: provErr } = await db
      .from('partner_lms_providers')
      .upsert(
        {
          provider_name: provider.name,
          provider_type: provider.type,
          website_url:   provider.websiteUrl,
          support_email: provider.supportEmail,
          active:        true,
          updated_at:    new Date().toISOString(),
        },
        { onConflict: 'provider_name' }
      )
      .select('id')
      .single();

    if (provErr || !providerRow) {
      errors.push(`Provider "${provider.name}": ${provErr?.message ?? 'no row returned'}`);
      continue;
    }

    providersUpserted++;
    const providerId = providerRow.id;

    // Upsert each course — identity key: (provider_id, course_name)
    for (const course of provider.courses) {
      const courseType = MICRO_COURSE_IDS.has(course.id) ? 'micro' : 'partner';

      const { error: courseErr } = await db
        .from('partner_lms_courses')
        .upsert(
          {
            provider_id:        providerId,
            course_name:        course.title,
            course_code:        course.id,
            course_description: course.description,
            duration_hours:     parseDurationHours(course.duration),
            retail_price_cents: Math.round(course.price * 100),
            is_active:          course.isActive,
            active:             course.isActive,
            course_type:        courseType,
            updated_at:         new Date().toISOString(),
          },
          { onConflict: 'provider_id,course_name' }
        );

      if (courseErr) {
        errors.push(`Course "${course.title}" (${provider.name}): ${courseErr.message}`);
      } else {
        coursesUpserted++;
      }
    }
  }

  return { providersUpserted, coursesUpserted, errors };
}

function parseDurationHours(duration: string): number {
  const match = duration.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}
