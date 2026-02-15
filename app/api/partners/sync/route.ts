import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * POST /api/partners/sync
 * 
 * Automated Content Sync - syncs content from external partners.
 * Can be triggered manually or via cron job.
 * 
 * Body:
 * - partner_id: string (optional - sync specific partner)
 * - course_id: string (optional - sync specific course)
 * - force: boolean (optional - force sync even if recently synced)
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    // Verify cron secret or admin auth
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Check if user is admin
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (profile?.role !== 'admin' && profile?.role !== 'staff') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }
    }

    const body = await request.json().catch(() => ({}));
    const { partner_id, course_id, force = false } = body;

    // Get courses that need syncing
    let query = supabase
      .from('courses')
      .select('*')
      .eq('is_active', true)
      .eq('delivery_mode', 'partner_link')
      .not('partner_url', 'is', null);

    if (course_id) {
      query = query.eq('id', course_id);
    }

    if (partner_id) {
      query = query.eq('partner_id', partner_id);
    }

    // Only sync courses not synced in last 24 hours (unless forced)
    if (!force) {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      query = query.or(`last_synced_at.is.null,last_synced_at.lt.${oneDayAgo}`);
    }

    const { data: courses, error } = await query;

    if (error) {
      logger.error('Sync query error:', error);
      return NextResponse.json({ error: 'Failed to fetch courses for sync' }, { status: 500 });
    }

    const syncResults: Array<{
      course_id: string;
      course_name: string;
      status: 'success' | 'skipped' | 'error';
      message: string;
    }> = [];

    // Process each course
    for (const course of courses || []) {
      try {
        // Check if partner URL is accessible
        const urlCheck = await checkPartnerUrl(course.partner_url);
        
        if (urlCheck.accessible) {
          // Update last_synced_at
          await supabase
            .from('courses')
            .update({
              last_synced_at: new Date().toISOString(),
              external_version: urlCheck.version || null,
            })
            .eq('id', course.id);

          syncResults.push({
            course_id: course.id,
            course_name: course.course_name,
            status: 'success',
            message: `Synced successfully. URL accessible.${urlCheck.version ? ` Version: ${urlCheck.version}` : ''}`,
          });
        } else {
          syncResults.push({
            course_id: course.id,
            course_name: course.course_name,
            status: 'error',
            message: `Partner URL not accessible: ${urlCheck.error}`,
          });
        }
      } catch (err) {
        syncResults.push({
          course_id: course.id,
          course_name: course.course_name,
          status: 'error',
          message: `Sync failed: ${'Internal server error'}`,
        });
      }
    }

    // Log sync event
    await supabase.from('audit_logs').insert({
      action: 'content_sync',
      details: {
        total_courses: courses?.length || 0,
        successful: syncResults.filter(r => r.status === 'success').length,
        failed: syncResults.filter(r => r.status === 'error').length,
        partner_id,
        course_id,
        forced: force,
      },
    }).catch(() => {}); // Don't fail if audit log fails

    return NextResponse.json({
      status: 'success',
      data: {
        total: courses?.length || 0,
        synced: syncResults.filter(r => r.status === 'success').length,
        errors: syncResults.filter(r => r.status === 'error').length,
        results: syncResults,
      },
    });
  } catch (error) {
    logger.error('Sync API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Check if partner URL is accessible and extract version if available
 */
async function checkPartnerUrl(url: string): Promise<{
  accessible: boolean;
  version?: string;
  error?: string;
}> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Elevate-LMS-Sync/1.0',
      },
    });

    clearTimeout(timeout);

    if (response.ok) {
      // Try to extract version from headers
      const version = response.headers.get('x-content-version') ||
                     response.headers.get('etag') ||
                     response.headers.get('last-modified');
      
      return { accessible: true, version: version || undefined };
    } else {
      return { accessible: false, error: `HTTP ${response.status}` };
    }
  } catch (err) {
    return {
      accessible: false,
      error: 'Internal server error',
    };
  }
}

/**
 * GET /api/partners/sync
 * 
 * Get sync status for courses
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get('partner_id');

    let query = supabase
      .from('courses')
      .select('id, course_name, partner_url, last_synced_at, external_version, delivery_mode')
      .eq('delivery_mode', 'partner_link')
      .not('partner_url', 'is', null)
      .order('last_synced_at', { ascending: true, nullsFirst: true });

    if (partnerId) {
      query = query.eq('partner_id', partnerId);
    }

    const { data: courses, error } = await query;

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch sync status' }, { status: 500 });
    }

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const status = {
      total: courses?.length || 0,
      synced_recently: courses?.filter(c => c.last_synced_at && new Date(c.last_synced_at) > oneDayAgo).length || 0,
      needs_sync: courses?.filter(c => !c.last_synced_at || new Date(c.last_synced_at) <= oneDayAgo).length || 0,
      never_synced: courses?.filter(c => !c.last_synced_at).length || 0,
      courses: courses?.map(c => ({
        id: c.id,
        name: c.course_name,
        last_synced: c.last_synced_at,
        external_version: c.external_version,
        needs_sync: !c.last_synced_at || new Date(c.last_synced_at) <= oneDayAgo,
      })),
    };

    return NextResponse.json({ status: 'success', data: status });
  } catch (error) {
    logger.error('Sync status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
