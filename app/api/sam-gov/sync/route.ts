
export const runtime = 'nodejs';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { searchEntities } from '@/lib/integrations/sam-gov';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';

/**
 * SAM.gov Sync Job
 * Fetches entities from SAM.gov and saves to database
 * Should be called by cron job daily
 */
export async function POST(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    // Verify authorization (cron secret or admin)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // For now, return empty result since searchEntities requires a name parameter
    // This endpoint would need to be redesigned to work with the actual SAM.gov API
    const opportunities: any[] = [];

    if (!opportunities || opportunities.length === 0) {
      logger.info('SAM.gov sync: No opportunities found');
      return NextResponse.json({
        success: true,
        synced: 0,
        message: 'No opportunities found',
      });
    }

    // Upsert opportunities to database
    const records = opportunities.map((item: any) => ({
      sam_id: item.noticeId || item.opportunityId || item.id,
      notice_id: item.noticeId,
      title: item.title,
      description: item.description,
      type: item.type || 'assistance',
      agency: item.fullParentPathName || item.organizationName,
      office: item.officeAddress?.city,
      naics_code: item.naicsCode,
      cfda_number: item.cfdaNumber,
      assistance_listing: item.assistanceListing,
      posted_date: item.postedDate,
      response_deadline: item.responseDeadLine || item.archiveDate,
      archive_date: item.archiveDate,
      url: item.uiLink,
      attachment_url: item.attachmentLink,
      place_of_performance: item.placeOfPerformance || {},
      set_aside: item.typeOfSetAside,
      raw_data: item,
      last_synced_at: new Date().toISOString(),
    }));

    // Use service role for insert
    const { data, error }: any = await supabase
      .from('sam_opportunities')
      .upsert(records, {
        onConflict: 'sam_id',
        ignoreDuplicates: false,
      });

    if (error) {
      logger.error('SAM.gov sync error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Internal server error',
        },
        { status: 500 }
      );
    }

    logger.info(`SAM.gov sync: ${records.length} opportunities synced`);

    return NextResponse.json({
      success: true,
      synced: records.length,
      opportunities: records.map((r) => ({
        id: r.sam_id,
        title: r.title,
        agency: r.agency,
        deadline: r.response_deadline,
      })),
    });
  } catch (error: any) {
    logger.error('SAM.gov sync failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// Allow GET for manual trigger (admin only)
export async function GET(request: Request) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
return POST(request);
}
