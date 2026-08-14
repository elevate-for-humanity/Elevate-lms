/**
 * POST /api/admin/industry/refresh-standards
 *
 * Admin-triggered refresh of industry standards for a SOC code.
 * Fetches live data from O*NET + BLS + CareerOneStop and writes to
 * the occupation_standards cache table.
 *
 * Body: { soc_code: string, credential_code?: string, force?: boolean }
 *
 * GET /api/admin/industry/refresh-standards?soc_code=21-1093.00
 * Returns cached standards (or null if not cached) without fetching.
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { loadIndustryStandards } from '@/lib/industry/standards-loader';
import { PROGRAM_SOC_CODES } from '@/lib/industry/onet';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // O*NET requires ~8 sequential calls with 1.1s delays

async function _POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  if (!body?.soc_code) return safeError('soc_code is required', 400);

  const { soc_code, credential_code, force = true } = body;

  // Validate SOC code format
  if (!/^\d{2}-\d{4}\.\d{2}$/.test(soc_code)) {
    return safeError('soc_code must be in format XX-XXXX.XX (e.g. 21-1093.00)', 400);
  }

  try {
    const standards = await loadIndustryStandards(soc_code, credential_code ?? null, force);

    if (!standards) {
      return NextResponse.json({
        ok: false,
        message: 'No data returned. Check ONET_API_KEY (or ONET_USERNAME/ONET_PASSWORD) and BLS_API_KEY.',
        soc_code,
      }, { status: 200 });
    }

    return NextResponse.json({
      ok: true,
      soc_code,
      occupation_title: standards.occupation_title,
      sources: standards.sources,
      is_cached: standards.is_cached,
      task_count: standards.top_tasks.length,
      skill_count: standards.top_skills.length,
      domain_count: standards.credential_domains.length,
      median_annual_wage: standards.median_annual_wage,
      indiana_median_wage: standards.indiana_median_wage,
      projected_growth_cat: standards.projected_growth_cat,
      certification_count: standards.certifications.length,
      fetched_at: standards.fetched_at,
      // Full standards object for the admin UI preview
      standards,
    });
  } catch (err) {
    return safeInternalError(err, 'Failed to refresh industry standards');
  }
}

async function _GET(request: NextRequest) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const socCode = searchParams.get('soc_code');
  const programSlug = searchParams.get('program_slug');

  // Resolve SOC code from program slug if provided
  const resolvedSoc = socCode ?? (programSlug ? PROGRAM_SOC_CODES[programSlug] : null);

  if (!resolvedSoc) {
    // Return the full SOC code registry so the UI can show a picker
    return NextResponse.json({
      registry: Object.entries(PROGRAM_SOC_CODES).map(([slug, soc]) => ({ slug, soc_code: soc })),
    });
  }

  try {
    const db = await requireAdminClient();

    // Check what's in cache without fetching
    const { data: rows } = await db
      .from('occupation_standards')
      .select('source, soc_title, fetched_at, expires_at, median_annual_wage, projected_growth_cat, projected_growth_pct')
      .eq('soc_code', resolvedSoc);

    const { data: domains } = await db
      .from('credential_domains')
      .select('credential_code, credential_title, governing_body, compliance_status, domains')
      .order('credential_code');

    return NextResponse.json({
      soc_code: resolvedSoc,
      cached_sources: rows ?? [],
      is_fresh: rows?.some(r => new Date(r.expires_at) > new Date()) ?? false,
      credential_domains: domains ?? [],
    });
  } catch (err) {
    return safeInternalError(err, 'Failed to load cached standards');
  }
}

export const POST = _POST;
export const GET = _GET;
