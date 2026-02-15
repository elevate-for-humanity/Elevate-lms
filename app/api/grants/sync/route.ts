
/**
 * Grants Sync API Route
 * Syncs grant opportunities from Grants.gov to local database
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { logger } from '@/lib/logger';
import {
  searchWorkforceGrants,
  searchEducationGrants,
  searchDOLGrants,
  searchHHSGrants,
  type GrantsGovOpportunity,
} from '@/lib/integrations/grants-gov';
import { applyRateLimit } from '@/lib/api/withRateLimit';

/**
 * POST /api/grants/sync
 * Sync grants from Grants.gov to local database
 */
export async function POST(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    // Ensure grant source exists
    const { data: source, error: sourceError } = await supabaseAdmin
      .from('grant_sources')
      .upsert(
        {
          name: 'Grants.gov',
          code: 'grants_gov',
          base_url: 'https://www.grants.gov',
        },
        { onConflict: 'code' }
      )
      .select()
      .single();

    if (sourceError || !source) {
      logger.error('Failed to ensure grant source:', sourceError);
      return NextResponse.json(
        { error: 'Failed to ensure grant source' },
        { status: 500 }
      );
    }

    // Fetch grants from multiple relevant categories
    const [workforceGrants, educationGrants, dolGrants, hhsGrants] = await Promise.all([
      searchWorkforceGrants(),
      searchEducationGrants(),
      searchDOLGrants(),
      searchHHSGrants(),
    ]);

    // Combine and deduplicate
    const allOpportunities = [
      ...workforceGrants.opportunities,
      ...educationGrants.opportunities,
      ...dolGrants.opportunities,
      ...hhsGrants.opportunities,
    ];

    const uniqueOpportunities = Array.from(
      new Map(allOpportunities.map(o => [o.id, o])).values()
    );

    logger.info(`Found ${uniqueOpportunities.length} unique grant opportunities`);

    let imported = 0;
    let errors = 0;

    for (const grant of uniqueOpportunities) {
      const { error } = await supabaseAdmin.from('grant_opportunities').upsert(
        {
          source_id: source.id,
          external_id: grant.id,
          title: grant.title,
          agency: grant.agency.name,
          summary: grant.synopsis?.synopsisDesc || '',
          eligibility: grant.eligibility?.additionalInfo || '',
          cfda_number: grant.cfdaList?.[0]?.cfdaNumber || null,
          categories: grant.synopsis?.fundingActivityCategories || [],
          award_ceiling: grant.award?.ceiling || null,
          award_floor: grant.award?.floor || null,
          due_date: grant.dates.closeDate || null,
          status: grant.status,
          url: grant.opportunityUrl,
          raw_json: grant,
        },
        { onConflict: 'source_id,external_id' }
      );

      if (error) {
        logger.error('Error upserting grant:', grant.id, error);
        errors++;
      } else {
        imported++;
      }
    }

    return NextResponse.json({
      ok: true,
      source: 'grants.gov',
      found: uniqueOpportunities.length,
      imported,
      errors,
      breakdown: {
        workforce: workforceGrants.totalCount,
        education: educationGrants.totalCount,
        dol: dolGrants.totalCount,
        hhs: hhsGrants.totalCount,
      },
    });
  } catch (err) {
    logger.error('Unexpected error during grant sync:', err);
    return NextResponse.json(
      { error: 'Unexpected error during grant sync' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/grants/sync
 * Get sync status and recent grants
 */
export async function GET() {
  try {
    // Get grant counts
    const { count: totalGrants } = await supabaseAdmin
      .from('grant_opportunities')
      .select('*', { count: 'exact', head: true });

    // Get upcoming deadlines
    const { data: upcomingDeadlines } = await supabaseAdmin
      .from('grant_opportunities')
      .select('id, title, agency, due_date, award_ceiling')
      .gte('due_date', new Date().toISOString().split('T')[0])
      .order('due_date', { ascending: true })
      .limit(10);

    return NextResponse.json({
      totalGrants: totalGrants || 0,
      upcomingDeadlines: upcomingDeadlines || [],
    });
  } catch (err) {
    logger.error('Error getting sync status:', err);
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    );
  }
}
